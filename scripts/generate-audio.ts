/**
 * Generate chunked audio narration per sutta via Gemini TTS.
 *
 * Usage:
 *   pnpm generate-audio [slug] [locale]
 *
 * Defaults: slug=first-talk, locale=en
 *
 * Requires: GOOGLE_GENERATIVE_AI_KEY in .env.local
 * Optional: ffmpeg in PATH (falls back to WAV if missing)
 */

import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  statSync,
  appendFileSync,
} from "node:fs";
import { execSync, spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// ─── CLI args ────────────────────────────────────────────────────────────────

const [, , argSlug, argLocale] = process.argv;
const SLUG = argSlug ?? "first-talk";
const LOCALE = argLocale ?? "en";

// ─── Config ──────────────────────────────────────────────────────────────────

const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const VOICE = "Charon";

const TONE_PREFIX =
  "Narrate this slowly, calmly, contemplatively. Pause naturally at every em-dash (—) and period. Let phrases breathe. Use a steady, grounded voice — the unhurried tone of an old story being told well:\n\n";

// ─── Types ───────────────────────────────────────────────────────────────────

type Section = {
  id: string;
  title: string;
  text: string;
};

type ManifestSection = {
  id: string;
  title: string;
  file: string;
  duration_sec: number;
};

type Manifest = {
  slug: string;
  locale: string;
  voice: string;
  model: string;
  generated_at: string;
  sections: ManifestSection[];
};

// ─── MDX parser ──────────────────────────────────────────────────────────────

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function cleanForTTS(text: string): string {
  // Remove horizontal rules
  let out = text.replace(/^---+$/gm, "");

  // Strip bold/italic markers but keep text
  out = out.replace(/\*\*\*(.+?)\*\*\*/g, "$1");
  out = out.replace(/\*\*(.+?)\*\*/g, "$1");
  out = out.replace(/\*(.+?)\*/g, "$1");
  out = out.replace(/_(.+?)_/g, "$1");

  // Strip block quotes
  out = out.replace(/^>\s*/gm, "");

  // Convert numbered list items to natural flow (keep the text, add comma pause)
  out = out.replace(/^\d+\.\s+/gm, "");

  // Convert bullet list items
  out = out.replace(/^[-*]\s+/gm, "");

  // Collapse multiple blank lines → double newline → period/pause boundary
  out = out.replace(/\n{3,}/g, "\n\n");

  // Replace double newlines with a period + space for prosody
  out = out.replace(/\n\n+/g, ". ");

  // Replace single newlines with a space
  out = out.replace(/\n/g, " ");

  // Fix double-period artifacts (e.g. sentence ends with "." then we add ".")
  out = out.replace(/\.\.+/g, ".");

  // Fix ". ." artifacts
  out = out.replace(/\.\s+\./g, ".");

  // Trim
  out = out.trim();

  return out;
}

function parseMDX(filePath: string): Section[] {
  const raw = readFileSync(filePath, "utf8");

  // 1. Strip YAML frontmatter
  let content = raw;
  if (content.startsWith("---")) {
    const end = content.indexOf("---", 3);
    if (end !== -1) {
      content = content.slice(end + 3).trimStart();
    }
  }

  // 2. Strip H1 title line
  content = content.replace(/^#\s+.+\n?/, "");

  // 3. Strip italicized subtitle right after H1 (e.g. *His first teaching...*)
  // This is a line starting with *... and ending with *
  content = content.replace(/^\*[^*\n]+\*\s*\n?/, "");

  // 4. Split by H2 headings
  const h2Regex = /^## (.+)$/m;
  const parts = content.split(/^## /m);

  const sections: Section[] = [];

  // First part = Opening (text before first ##)
  const openingRaw = parts[0].trim();
  if (openingRaw) {
    sections.push({
      id: "opening",
      title: "Opening",
      text: cleanForTTS(openingRaw),
    });
  }

  // Remaining parts start with the heading text
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const lineBreak = part.indexOf("\n");
    const headingText =
      lineBreak === -1 ? part.trim() : part.slice(0, lineBreak).trim();
    const body = lineBreak === -1 ? "" : part.slice(lineBreak + 1).trim();
    sections.push({
      id: toKebabCase(headingText),
      title: headingText,
      text: cleanForTTS(body),
    });
  }

  return sections;
}

// ─── WAV header ──────────────────────────────────────────────────────────────

function buildWavHeader(pcmLength: number): Buffer {
  const header = Buffer.alloc(44);
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmLength, 40);
  return header;
}

// ─── Duration helpers ────────────────────────────────────────────────────────

function wavDurationSec(pcmBytes: number): number {
  // 24000 samples/sec × 2 bytes/sample = 48000 bytes/sec
  return Math.round((pcmBytes / 48000) * 10) / 10;
}

function mp3DurationSec(mp3Path: string): number {
  try {
    const result = spawnSync(
      "ffprobe",
      [
        "-i",
        mp3Path,
        "-show_entries",
        "format=duration",
        "-of",
        "csv=p=0",
        "-v",
        "quiet",
      ],
      { encoding: "utf8" }
    );
    const secs = parseFloat(result.stdout.trim());
    if (isNaN(secs)) return 0;
    return Math.round(secs * 10) / 10;
  } catch {
    return 0;
  }
}

// ─── Gemini TTS ──────────────────────────────────────────────────────────────

type UsageMetadata = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
};

type GeminiTTSResponse = {
  candidates?: {
    content?: {
      parts?: {
        inlineData?: { data?: string; mimeType?: string };
        inline_data?: { data?: string; mime_type?: string };
      }[];
    };
  }[];
  usageMetadata?: UsageMetadata;
  error?: { message?: string; status?: string; code?: number };
};

type TTSSuccess = { audio: Buffer; usage: UsageMetadata };

// Gemini 2.5 Flash Preview TTS pricing (paid tier, as of 2026-05):
// Input: $0.50 per 1M tokens · Output (audio): $10 per 1M tokens
const PRICE_INPUT_PER_MTOK = 0.5;
const PRICE_OUTPUT_PER_MTOK = 10;

function estimateCost(usage: UsageMetadata): number {
  const inputTok = usage.promptTokenCount ?? 0;
  const outputTok = usage.candidatesTokenCount ?? 0;
  return (
    (inputTok / 1_000_000) * PRICE_INPUT_PER_MTOK +
    (outputTok / 1_000_000) * PRICE_OUTPUT_PER_MTOK
  );
}

async function callGeminiTTS(
  text: string,
  apiKey: string
): Promise<TTSSuccess | { error: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: TONE_PREFIX + text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: VOICE },
        },
      },
    },
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return { error: `Network error: ${String(err)}` };
  }

  const responseText = await res.text();

  if (!res.ok) {
    return { error: `HTTP ${res.status}: ${responseText.slice(0, 600)}` };
  }

  let json: GeminiTTSResponse;
  try {
    json = JSON.parse(responseText) as GeminiTTSResponse;
  } catch {
    return { error: `Non-JSON response: ${responseText.slice(0, 400)}` };
  }

  if (json.error) {
    return {
      error: `API error: ${json.error.message ?? JSON.stringify(json.error)}`,
    };
  }

  const usage: UsageMetadata = json.usageMetadata ?? {};
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    const data = p.inlineData?.data ?? p.inline_data?.data;
    if (data) {
      return { audio: Buffer.from(data, "base64"), usage };
    }
  }

  return {
    error: `No audio data in response: ${responseText.slice(0, 400)}`,
  };
}

// ─── ffmpeg check ────────────────────────────────────────────────────────────

function hasFfmpeg(): boolean {
  try {
    const result = spawnSync("which", ["ffmpeg"], { encoding: "utf8" });
    return result.status === 0 && result.stdout.trim().length > 0;
  } catch {
    return false;
  }
}

function convertToMp3(wavPath: string, mp3Path: string): void {
  const result = spawnSync(
    "ffmpeg",
    ["-y", "-i", wavPath, "-codec:a", "libmp3lame", "-qscale:a", "4", mp3Path],
    { encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed:\n${result.stderr}`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY;
  if (!apiKey) {
    console.error(
      "ERROR: GOOGLE_GENERATIVE_AI_KEY not set. Run via pnpm generate-audio (uses --env-file=.env.local)."
    );
    process.exit(1);
  }

  const useFfmpeg = hasFfmpeg();
  const ext = useFfmpeg ? "mp3" : "wav";

  if (!useFfmpeg) {
    console.warn(
      "WARNING: ffmpeg not found — writing WAV files instead of MP3. Browsers play WAV fine."
    );
  } else {
    console.log("ffmpeg found — will produce MP3.");
  }

  // Resolve MDX path
  const mdxPath = join(ROOT, "src", "content", LOCALE, `${SLUG}.mdx`);
  if (!existsSync(mdxPath)) {
    console.error(`ERROR: MDX file not found: ${mdxPath}`);
    process.exit(1);
  }

  // Output directory
  const outDir = join(ROOT, "public", "audio", LOCALE, SLUG);
  const manifestPath = join(outDir, "manifest.json");

  // Skip-existing check
  if (existsSync(manifestPath)) {
    const existing = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
    const allFilesExist = existing.sections.every((s) =>
      existsSync(join(outDir, s.file))
    );
    if (allFilesExist) {
      console.log(
        `Skipping — manifest and all ${existing.sections.length} audio files already exist in ${outDir}`
      );
      return;
    }
    console.log(
      "Manifest exists but some files are missing — regenerating all sections."
    );
  }

  mkdirSync(outDir, { recursive: true });

  // Parse MDX into sections
  console.log(`\nParsing ${mdxPath}...`);
  const sections = parseMDX(mdxPath);
  console.log(`Found ${sections.length} sections:`);
  for (const s of sections) {
    console.log(`  [${s.id}] "${s.title}" — ${s.text.length} chars`);
  }

  const totalChars = sections.reduce((n, s) => n + s.text.length, 0);
  console.log(`\nTotal text chars: ${totalChars}`);

  // Generate audio for each section
  const manifestSections: ManifestSection[] = [];
  const tmpDir = tmpdir();
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCost = 0;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const ordinal = String(i + 1).padStart(2, "0");
    const baseFilename = `${ordinal}-${section.id}`;
    const outputFilename = `${baseFilename}.${ext}`;
    const outputPath = join(outDir, outputFilename);

    console.log(
      `\n[${i + 1}/${sections.length}] Generating "${section.title}"...`
    );
    console.log(`  Text (${section.text.length} chars): ${section.text.slice(0, 80)}...`);

    const result = await callGeminiTTS(section.text, apiKey);
    if ("error" in result) {
      console.error(`  ERROR: ${result.error}`);
      process.exit(1);
    }

    const { audio: pcmBuffer, usage } = result;
    const sectionCost = estimateCost(usage);
    totalInputTokens += usage.promptTokenCount ?? 0;
    totalOutputTokens += usage.candidatesTokenCount ?? 0;
    totalCost += sectionCost;

    console.log(`  Received ${pcmBuffer.length} bytes of PCM audio.`);
    console.log(
      `  Usage: ${usage.promptTokenCount ?? 0} in / ${usage.candidatesTokenCount ?? 0} out tokens · est. $${sectionCost.toFixed(4)}`
    );

    // Build WAV from raw PCM
    const wavHeader = buildWavHeader(pcmBuffer.length);
    const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);

    let duration: number;

    if (useFfmpeg) {
      // Write temp WAV, convert to MP3
      const tmpWav = join(tmpDir, `${baseFilename}.wav`);
      writeFileSync(tmpWav, wavBuffer);
      convertToMp3(tmpWav, outputPath);
      duration = mp3DurationSec(outputPath);
      // Clean up temp WAV (best-effort)
      try {
        import("node:fs").then((m) => m.unlinkSync(tmpWav));
      } catch {}
      console.log(`  Saved MP3: ${outputPath} (${duration}s)`);
    } else {
      // Write WAV directly
      writeFileSync(outputPath, wavBuffer);
      duration = wavDurationSec(pcmBuffer.length);
      console.log(`  Saved WAV: ${outputPath} (${duration}s)`);
    }

    manifestSections.push({
      id: section.id,
      title: section.title,
      file: outputFilename,
      duration_sec: duration,
    });
  }

  // Write manifest
  const manifest: Manifest = {
    slug: SLUG,
    locale: LOCALE,
    voice: VOICE,
    model: TTS_MODEL,
    generated_at: new Date().toISOString(),
    sections: manifestSections,
  };

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to ${manifestPath}`);

  // ─── Usage summary + persistent log ────────────────────────────────────────
  const totalDurationSec = manifestSections.reduce(
    (n, s) => n + s.duration_sec,
    0
  );
  console.log("\n=== Usage Summary ===");
  console.log(`  Input tokens:  ${totalInputTokens.toLocaleString()}`);
  console.log(`  Output tokens: ${totalOutputTokens.toLocaleString()}`);
  console.log(`  Audio:         ${totalDurationSec.toFixed(1)}s across ${manifestSections.length} sections`);
  console.log(`  Est. cost:     $${totalCost.toFixed(4)} USD`);
  console.log(`  Pricing model: $${PRICE_INPUT_PER_MTOK}/1M input, $${PRICE_OUTPUT_PER_MTOK}/1M output (paid tier)`);

  // Append to persistent usage log (one JSON line per run)
  const usageLogPath = join(process.cwd(), "scripts", "audio-usage-log.jsonl");
  const usageEntry = {
    timestamp: new Date().toISOString(),
    slug: SLUG,
    locale: LOCALE,
    voice: VOICE,
    model: TTS_MODEL,
    input_tokens: totalInputTokens,
    output_tokens: totalOutputTokens,
    duration_sec: Number(totalDurationSec.toFixed(1)),
    sections: manifestSections.length,
    estimated_cost_usd: Number(totalCost.toFixed(6)),
  };
  appendFileSync(usageLogPath, JSON.stringify(usageEntry) + "\n");
  console.log(`  Logged to:     ${usageLogPath}`);

  console.log("\nDone! Sections:");
  for (const s of manifest.sections) {
    console.log(`  ${s.file}  (${s.duration_sec}s)`);
  }
  console.log(`\nTotal sections: ${manifest.sections.length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
