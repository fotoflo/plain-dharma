/**
 * Generate chunked audio narration per sutta via OpenAI gpt-4o-mini-tts.
 *
 * Usage:
 *   pnpm generate-audio [slug] [locale]
 *
 * Defaults: slug=first-talk, locale=en
 *
 * Requires: OPENAI_SECRET_KEY in .env.local
 * Optional: ffprobe in PATH (for accurate mp3 duration; estimates otherwise)
 */

import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  appendFileSync,
  copyFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// ─── CLI args ────────────────────────────────────────────────────────────────

const rawArgs = process.argv.slice(2);
const positionals = rawArgs.filter((a) => !a.startsWith("--"));
const flagPairs = rawArgs
  .filter((a) => a.startsWith("--"))
  .map((a) => {
    const [k, v = "true"] = a.slice(2).split("=");
    return [k, v] as const;
  });
const FLAGS: Record<string, string> = Object.fromEntries(flagPairs);

const SLUG = positionals[0] ?? "first-talk";
const LOCALE = positionals[1] ?? "en";
const SECTION_FILTER = FLAGS.section; // undefined = all sections
const PROVIDER = (FLAGS.provider ?? "openai") as "openai" | "elevenlabs";

// ─── Config ──────────────────────────────────────────────────────────────────

// OpenAI gpt-4o-mini-tts voices: alloy, ash, ballad, coral, echo, fable, nova,
// onyx, sage, shimmer, verse. Set per provider.
const OPENAI_MODEL = "gpt-4o-mini-tts";
const OPENAI_VOICE = "sage";

// ElevenLabs — voice IDs come from the ElevenLabs voice library.
// Priyanka: BpjGufoPiobT79j2vtj4
// `--model=eleven_v3` (default) honors inline [pause]/[gentle] audio tags.
// `--model=eleven_multilingual_v2` is more voice-stable but doesn't understand
// audio tags — the script strips them from the text on that path.
const ELEVEN_MODEL = FLAGS.model ?? "eleven_v3";
const ELEVEN_VOICE_ID = FLAGS.voiceId ?? "BpjGufoPiobT79j2vtj4";

// Voice prompt + TTS-mirror MDX live under src/content/{locale}_tts/.
// The mirror has inline audio tags woven through the text; the OpenAI path
// reads the cleaner src/content/{locale}/ MDX and passes the prompt as the
// `instructions` field instead.
const TTS_DIR_SUFFIX = "_tts";
const VOICE_PROMPT_FILENAME = "voice-prompt.txt";

const RESPONSE_FORMAT = "mp3";

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
    .replace(/[^a-z0-9一-鿿㐀-䶿\s-]/g, "")
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
  out = out.trim();
  return out;
}

function parseMDX(filePath: string): Section[] {
  const raw = readFileSync(filePath, "utf8");

  let content = raw;
  if (content.startsWith("---")) {
    const end = content.indexOf("---", 3);
    if (end !== -1) {
      content = content.slice(end + 3).trimStart();
    }
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
    // Speak the section heading before the body. Period+long-pause gives v3
    // a clear pause; v2 ignores the tag and just respects the period.
    const cleanedBody = cleanForTTS(body);
    sections.push({
      id: toKebabCase(headingText),
      title: headingText,
      text: `${headingText}. [long pause] ${cleanedBody}`,
    });
  }

  return sections;
}

// ─── Duration ────────────────────────────────────────────────────────────────

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

function hasFfprobe(): boolean {
  const result = spawnSync("which", ["ffprobe"], { encoding: "utf8" });
  return result.status === 0 && result.stdout.trim().length > 0;
}

// ─── OpenAI TTS ──────────────────────────────────────────────────────────────

// gpt-4o-mini-tts pricing (as of 2026-05): about $0.015/min of audio output.
// Input text is billed at $0.60/1M tokens (~$0.00015 per 1k chars).
// Cost estimate combines both, dominated by audio.
const PRICE_PER_AUDIO_MIN = 0.015;
const PRICE_INPUT_PER_1K_CHARS = 0.00015;

type TTSSuccess = { audio: Buffer };

async function callOpenAITTS(
  text: string,
  apiKey: string,
  instructions: string
): Promise<TTSSuccess | { error: string }> {
  const url = "https://api.openai.com/v1/audio/speech";

  const body = {
    model: OPENAI_MODEL,
    voice: OPENAI_VOICE,
    input: text,
    instructions,
    response_format: RESPONSE_FORMAT,
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return { error: `Network error: ${String(err)}` };
  }

  if (!res.ok) {
    const errText = await res.text();
    return { error: `HTTP ${res.status}: ${errText.slice(0, 600)}` };
  }

  const arrayBuffer = await res.arrayBuffer();
  return { audio: Buffer.from(arrayBuffer) };
}

// ─── ElevenLabs TTS ──────────────────────────────────────────────────────────

async function callElevenLabsTTS(
  text: string,
  apiKey: string,
  voiceId: string
): Promise<TTSSuccess | { error: string }> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  // Only v3 understands inline audio tags. For v2 (or any non-v3), strip the
  // bracketed tags so they aren't read aloud literally.
  const cleanedText = ELEVEN_MODEL === "eleven_v3"
    ? text
    : text.replace(/\[[^\]]+\]/g, "").replace(/\s+/g, " ").trim();

  const body = {
    text: cleanedText,
    model_id: ELEVEN_MODEL,
    voice_settings: {
      // Lower stability + non-zero style = more expressive prosody. Override
      // via --stability=N --style=N CLI flags for per-run tuning.
      stability: FLAGS.stability ? Number(FLAGS.stability) : 0.5,
      similarity_boost: FLAGS.similarity ? Number(FLAGS.similarity) : 0.75,
      style: FLAGS.style ? Number(FLAGS.style) : 0.5,
      use_speaker_boost: true,
    },
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
    return { error: `HTTP ${res.status}: ${errText.slice(0, 600)}` };
  }

  const arrayBuffer = await res.arrayBuffer();
  return { audio: Buffer.from(arrayBuffer) };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const ttsDir = `${LOCALE}${TTS_DIR_SUFFIX}`;
  const promptPath = join(ROOT, "src", "content", ttsDir, VOICE_PROMPT_FILENAME);

  // Resolve provider config
  let apiKey: string | undefined;
  let mdxPath: string;
  let outLocaleDir: string;
  let modelLabel: string;
  let voiceLabel: string;

  if (PROVIDER === "elevenlabs") {
    apiKey = process.env.ELEVEN_LABS_KEY ?? process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error("ERROR: ELEVEN_LABS_KEY not set in .env.local.");
      process.exit(1);
    }
    // Eleven path prefers the audio-tag-laden mirror MDX. Falls back to the
    // canonical en/ file when no mirror exists — on v2 audio tags are stripped
    // anyway, so the canonical content works fine for the simpler model.
    const mirrorPath = join(ROOT, "src", "content", ttsDir, `${SLUG}.mdx`);
    mdxPath = existsSync(mirrorPath)
      ? mirrorPath
      : join(ROOT, "src", "content", LOCALE, `${SLUG}.mdx`);
    outLocaleDir = ttsDir; // public/audio/en_tts/<slug>/
    modelLabel = ELEVEN_MODEL;
    voiceLabel = ELEVEN_VOICE_ID;
  } else {
    apiKey = process.env.OPENAI_SECRET_KEY ?? process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("ERROR: OPENAI_SECRET_KEY not set in .env.local.");
      process.exit(1);
    }
    mdxPath = join(ROOT, "src", "content", LOCALE, `${SLUG}.mdx`);
    outLocaleDir = LOCALE; // public/audio/en/<slug>/
    modelLabel = OPENAI_MODEL;
    voiceLabel = OPENAI_VOICE;
  }

  console.log(`Provider: ${PROVIDER} · model: ${modelLabel} · voice: ${voiceLabel}`);

  const useFfprobe = hasFfprobe();
  if (!useFfprobe) {
    console.warn(
      "WARNING: ffprobe not found — durations will be estimated from text length."
    );
  }

  if (!existsSync(mdxPath)) {
    console.error(`ERROR: MDX file not found: ${mdxPath}`);
    process.exit(1);
  }

  // Load the voice prompt for both providers:
  //   - OpenAI: passed as the `instructions` field (separate from text).
  //   - ElevenLabs: prepended to the input text as shaping context.
  if (!existsSync(promptPath)) {
    console.error(`ERROR: voice prompt not found: ${promptPath}`);
    process.exit(1);
  }
  const instructions = readFileSync(promptPath, "utf8").trim();
  console.log(
    `Loaded voice prompt: ${promptPath} (${instructions.length} chars)`
  );

  const outDir = join(ROOT, "public", "audio", outLocaleDir, SLUG);
  const manifestPath = join(outDir, "manifest.json");

  if (existsSync(manifestPath) && !SECTION_FILTER) {
    const existing = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
    const sameModel =
      existing.model === modelLabel && existing.voice === voiceLabel;
    const allFilesExist = existing.sections.every((s) =>
      existsSync(join(outDir, s.file))
    );
    if (sameModel && allFilesExist) {
      console.log(
        `Skipping — manifest matches current model/voice and all ${existing.sections.length} audio files exist in ${outDir}`
      );
      return;
    }
    console.log(
      `Existing manifest uses ${existing.model} / ${existing.voice} — regenerating with ${modelLabel} / ${voiceLabel}.`
    );
  }

  mkdirSync(outDir, { recursive: true });

  console.log(`\nParsing ${mdxPath}...`);
  const allSections = parseMDX(mdxPath);
  console.log(`Found ${allSections.length} sections:`);
  for (const s of allSections) {
    console.log(`  [${s.id}] "${s.title}" — ${s.text.length} chars`);
  }

  const sections = SECTION_FILTER
    ? allSections.filter((s) => s.id === SECTION_FILTER)
    : allSections;

  if (SECTION_FILTER && sections.length === 0) {
    console.error(
      `ERROR: --section=${SECTION_FILTER} did not match any parsed section id.`
    );
    process.exit(1);
  }

  if (SECTION_FILTER) {
    console.log(`\nFiltered to --section=${SECTION_FILTER} (${sections.length} match).`);
  }

  const totalChars = sections.reduce((n, s) => n + s.text.length, 0);
  console.log(`\nTotal text chars: ${totalChars}`);

  mkdirSync(outDir, { recursive: true });

  const manifestSections: ManifestSection[] = [];
  let totalInputChars = 0;
  let totalDurationSec = 0;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const idxInAll = allSections.findIndex((s) => s.id === section.id);
    const ordinal = String(idxInAll + 1).padStart(2, "0");
    const baseFilename = `${ordinal}-${section.id}`;
    const outputFilename = `${baseFilename}.${RESPONSE_FORMAT}`;
    const outputPath = join(outDir, outputFilename);

    console.log(
      `\n[${i + 1}/${sections.length}] Generating "${section.title}"...`
    );
    console.log(
      `  Text (${section.text.length} chars): ${section.text.slice(0, 80)}...`
    );

    if (section.text.length > 4000) {
      console.warn(
        `  WARNING: section is ${section.text.length} chars; provider limits may apply.`
      );
    }

    const result =
      PROVIDER === "elevenlabs"
        ? await callElevenLabsTTS(section.text, apiKey, ELEVEN_VOICE_ID)
        : await callOpenAITTS(section.text, apiKey, instructions);
    if ("error" in result) {
      console.error(`  ERROR: ${result.error}`);
      process.exit(1);
    }

    writeFileSync(outputPath, result.audio);
    console.log(
      `  Saved ${RESPONSE_FORMAT.toUpperCase()}: ${outputPath} (${result.audio.length} bytes)`
    );

    const duration = useFfprobe
      ? mp3DurationSec(outputPath)
      : Math.round((section.text.length / 14) * 10) / 10; // ~14 chars/sec contemplative

    totalInputChars += section.text.length;
    totalDurationSec += duration;

    manifestSections.push({
      id: section.id,
      title: section.title,
      file: outputFilename,
      duration_sec: duration,
    });
  }

  // Single-section runs don't overwrite the full manifest — they emit
  // a sibling JSON for inspection only.
  const manifestFilename = SECTION_FILTER
    ? `manifest-${SECTION_FILTER}.json`
    : "manifest.json";
  const manifestOutPath = join(outDir, manifestFilename);

  const manifest: Manifest = {
    slug: SLUG,
    locale: LOCALE,
    voice: voiceLabel,
    model: modelLabel,
    generated_at: new Date().toISOString(),
    sections: manifestSections,
  };

  writeFileSync(manifestOutPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to ${manifestOutPath}`);

  // Auto-mirror ElevenLabs staging output to the live audio dir.
  // OpenAI already writes directly to the live dir, so this is a no-op there.
  if (PROVIDER === "elevenlabs") {
    const liveDir = join(ROOT, "public", "audio", LOCALE, SLUG);
    mkdirSync(liveDir, { recursive: true });

    for (const s of manifestSections) {
      const src = join(outDir, s.file);
      const dst = join(liveDir, s.file);
      copyFileSync(src, dst);
      console.log(`  Mirrored → ${dst}`);
    }

    const liveManifestPath = join(liveDir, "manifest.json");
    let liveManifest: Manifest;
    if (existsSync(liveManifestPath)) {
      liveManifest = JSON.parse(readFileSync(liveManifestPath, "utf8")) as Manifest;
      // Replace any sections whose id matches a regenerated one; keep order.
      // New ids (not in the live manifest) get appended at the end.
      const byId = new Map(manifestSections.map((s) => [s.id, s]));
      const merged = liveManifest.sections.map((s) => byId.get(s.id) ?? s);
      const existingIds = new Set(liveManifest.sections.map((s) => s.id));
      const newOnes = manifestSections.filter((s) => !existingIds.has(s.id));
      liveManifest = {
        ...liveManifest,
        generated_at: new Date().toISOString(),
        sections: [...merged, ...newOnes],
      };
    } else {
      liveManifest = { ...manifest };
    }
    writeFileSync(liveManifestPath, JSON.stringify(liveManifest, null, 2));
    console.log(`  Mirrored manifest → ${liveManifestPath}`);
  }

  const inputCost = (totalInputChars / 1000) * PRICE_INPUT_PER_1K_CHARS;
  const audioCost = (totalDurationSec / 60) * PRICE_PER_AUDIO_MIN;
  const totalCost = inputCost + audioCost;

  console.log("\n=== Usage Summary ===");
  console.log(`  Input chars:   ${totalInputChars.toLocaleString()}`);
  console.log(
    `  Audio:         ${totalDurationSec.toFixed(1)}s across ${manifestSections.length} sections`
  );
  console.log(
    `  Est. cost:     $${totalCost.toFixed(4)} USD  (input $${inputCost.toFixed(4)} + audio $${audioCost.toFixed(4)})`
  );
  console.log(
    `  Pricing model: $${PRICE_INPUT_PER_1K_CHARS}/1K input chars · $${PRICE_PER_AUDIO_MIN}/min audio output`
  );

  const usageLogPath = join(process.cwd(), "scripts", "audio-usage-log.jsonl");
  const usageEntry = {
    timestamp: new Date().toISOString(),
    slug: SLUG,
    locale: LOCALE,
    provider: PROVIDER,
    voice: voiceLabel,
    model: modelLabel,
    input_chars: totalInputChars,
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
