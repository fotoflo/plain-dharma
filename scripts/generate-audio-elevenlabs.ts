/**
 * Generate chunked audio narration per sutta via Eleven Labs TTS.
 *
 * Usage:
 *   pnpm generate-audio-elevenlabs [slug] [locale]
 *
 * Defaults: slug=first-talk, locale=en
 *
 * Requires: ELEVEN_LABS_KEY in .env.local
 * Returns MP3 directly — no ffmpeg / WAV conversion needed.
 */

import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  appendFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// ─── CLI args ────────────────────────────────────────────────────────────────

const [, , argSlug, argLocale] = process.argv;
const SLUG = argSlug ?? "first-talk";
const LOCALE = argLocale ?? "en";

// ─── Config ──────────────────────────────────────────────────────────────────

// George — calm male narrator, well-suited for contemplative reading.
const VOICE_NAME = "George";
const VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
const MODEL_ID = "eleven_multilingual_v2";

// Voice settings tuned for steady, contemplative narration.
// stability=0.7 keeps prosody consistent across sections (less drift).
const VOICE_SETTINGS = {
  stability: 0.7,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true,
};

// Pay-as-you-go ballpark: ~$0.30 per 1,000 chars. Actual depends on plan.
const PRICE_PER_1K_CHARS = 0.3;

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

// ─── MDX parser (shared shape with generate-audio.ts) ────────────────────────

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function cleanForTTS(text: string): string {
  let out = text.replace(/^---+$/gm, "");
  out = out.replace(/\*\*\*(.+?)\*\*\*/g, "$1");
  out = out.replace(/\*\*(.+?)\*\*/g, "$1");
  out = out.replace(/\*(.+?)\*/g, "$1");
  out = out.replace(/_(.+?)_/g, "$1");
  out = out.replace(/^>\s*/gm, "");
  out = out.replace(/^\d+\.\s+/gm, "");
  out = out.replace(/^[-*]\s+/gm, "");
  out = out.replace(/\n{3,}/g, "\n\n");
  out = out.replace(/\n\n+/g, ". ");
  out = out.replace(/\n/g, " ");
  out = out.replace(/\.\.+/g, ".");
  out = out.replace(/\.\s+\./g, ".");
  return out.trim();
}

function parseMDX(filePath: string): Section[] {
  const raw = readFileSync(filePath, "utf8");

  let content = raw;
  if (content.startsWith("---")) {
    const end = content.indexOf("---", 3);
    if (end !== -1) content = content.slice(end + 3).trimStart();
  }

  content = content.replace(/^#\s+.+\n?/, "");
  content = content.replace(/^\*[^*\n]+\*\s*\n?/, "");

  const parts = content.split(/^## /m);
  const sections: Section[] = [];

  const openingRaw = parts[0].trim();
  if (openingRaw) {
    sections.push({
      id: "opening",
      title: "Opening",
      text: cleanForTTS(openingRaw),
    });
  }

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

// ─── Duration helper (uses ffprobe if available; falls back to 0) ────────────

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

// ─── Eleven Labs API ─────────────────────────────────────────────────────────

async function callElevenLabs(
  text: string,
  apiKey: string
): Promise<Buffer | { error: string }> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

  const body = {
    text,
    model_id: MODEL_ID,
    voice_settings: VOICE_SETTINGS,
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return { error: `Network error: ${String(err)}` };
  }

  if (!res.ok) {
    const errText = await res.text();
    return { error: `HTTP ${res.status}: ${errText.slice(0, 500)}` };
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ─── .env.local loader ───────────────────────────────────────────────────────

function loadEnvLocal(): Record<string, string> {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) return {};
  const raw = readFileSync(envPath, "utf8");
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
  return out;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const env = loadEnvLocal();
  const apiKey = env.ELEVEN_LABS_KEY ?? process.env.ELEVEN_LABS_KEY;
  if (!apiKey) {
    console.error("ERROR: ELEVEN_LABS_KEY not found in .env.local or process.env");
    process.exit(1);
  }

  const mdxPath = join(ROOT, "src", "content", LOCALE, `${SLUG}.mdx`);
  if (!existsSync(mdxPath)) {
    console.error(`ERROR: MDX file not found: ${mdxPath}`);
    process.exit(1);
  }

  const outDir = join(ROOT, "public", "audio", LOCALE, SLUG);
  mkdirSync(outDir, { recursive: true });
  const manifestPath = join(outDir, "manifest.json");

  console.log(`Voice: ${VOICE_NAME} (${VOICE_ID})`);
  console.log(`Model: ${MODEL_ID}`);
  console.log(`Settings: stability=${VOICE_SETTINGS.stability}, similarity_boost=${VOICE_SETTINGS.similarity_boost}`);
  console.log(`\nParsing ${mdxPath}...`);

  const sections = parseMDX(mdxPath);
  console.log(`Found ${sections.length} sections:`);
  for (const s of sections) {
    console.log(`  [${s.id}] "${s.title}" — ${s.text.length} chars`);
  }

  const totalChars = sections.reduce((n, s) => n + s.text.length, 0);
  const estPretotal = ((totalChars / 1000) * PRICE_PER_1K_CHARS).toFixed(4);
  console.log(`\nTotal chars: ${totalChars}`);
  console.log(`Estimated cost (approx): $${estPretotal} USD @ $${PRICE_PER_1K_CHARS}/1K chars`);

  const manifestSections: ManifestSection[] = [];
  let totalCost = 0;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const ordinal = String(i + 1).padStart(2, "0");
    const outputFilename = `${ordinal}-${section.id}.mp3`;
    const outputPath = join(outDir, outputFilename);

    console.log(`\n[${i + 1}/${sections.length}] Generating "${section.title}"...`);
    console.log(`  Text (${section.text.length} chars): ${section.text.slice(0, 80)}...`);

    const result = await callElevenLabs(section.text, apiKey);
    if ("error" in result) {
      console.error(`  ERROR: ${result.error}`);
      process.exit(1);
    }

    writeFileSync(outputPath, result);
    const duration = mp3DurationSec(outputPath);
    const sectionCost = (section.text.length / 1000) * PRICE_PER_1K_CHARS;
    totalCost += sectionCost;

    console.log(`  Saved MP3: ${outputPath} (${duration}s, ${result.length} bytes)`);
    console.log(`  Est. section cost: $${sectionCost.toFixed(4)}`);

    manifestSections.push({
      id: section.id,
      title: section.title,
      file: outputFilename,
      duration_sec: duration,
    });
  }

  const manifest: Manifest = {
    slug: SLUG,
    locale: LOCALE,
    voice: VOICE_NAME,
    model: MODEL_ID,
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
  console.log(`  Provider:    elevenlabs`);
  console.log(`  Voice:       ${VOICE_NAME}`);
  console.log(`  Model:       ${MODEL_ID}`);
  console.log(`  Total chars: ${totalChars.toLocaleString()}`);
  console.log(`  Audio:       ${totalDurationSec.toFixed(1)}s across ${manifestSections.length} sections`);
  console.log(`  Est. cost:   $${totalCost.toFixed(4)} USD`);
  console.log(`  Rate:        $${PRICE_PER_1K_CHARS}/1K chars (approx, varies by plan)`);

  const usageLogPath = join(ROOT, "scripts", "audio-usage-log.jsonl");
  const usageEntry = {
    timestamp: new Date().toISOString(),
    provider: "elevenlabs",
    slug: SLUG,
    locale: LOCALE,
    voice: VOICE_NAME,
    model: MODEL_ID,
    total_chars: totalChars,
    duration_sec: Number(totalDurationSec.toFixed(1)),
    sections: manifestSections.length,
    estimated_cost_usd: Number(totalCost.toFixed(6)),
  };
  appendFileSync(usageLogPath, JSON.stringify(usageEntry) + "\n");
  console.log(`  Logged to:   ${usageLogPath}`);

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
