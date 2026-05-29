/**
 * Render the full English sutta audio pipeline in ONE command.
 *
 * For each sutta (canonical SUTTAS order, or a CLI-supplied subset):
 *   1. (Re)generate RAW body narration via generate-audio.ts — Theo Silk
 *      (eleven_multilingual_v2), from the canonical MDX. This covers the
 *      "opening" + each section body. The title/preface/drop *cards* are NOT
 *      regenerated (they're sourced separately) — they're preserved as-is.
 *   2. Stash each raw body clip as the untouched master:
 *        candidates/orig-<file>.mp3
 *   3. Render the two meditative paces FROM THE RAW MASTER (never re-stretch a
 *      slowed file — compounding atempo passes degrades quality):
 *        • live  <slug>/<file>.mp3   = atempo 0.8333  (−20%, default "Slower")
 *        • fast  <slug>/fast/<file>  = atempo 0.925   (−7.5%, the "Faster" option)
 *   4. Patch the manifest: update each body section's duration_sec /
 *      duration_fast_sec, and PRESERVE the card sections (title/preface/drop)
 *      exactly as they were — anything generate-audio didn't (re)produce is kept.
 * Then, unless --skip-audiobook: rebuild + publish the M4B audiobook.
 *
 * Usage:
 *   pnpm render-english-audio [slug ...] [--skip-audiobook] [--slow=0.8333] [--fast=0.925]
 *   (no slugs → all six suttas)
 *
 * Requires: ELEVEN_LABS_KEY in .env.local, ffmpeg + ffprobe in PATH.
 */

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SUTTAS } from "@plain-dharma/content";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCALE = "en";

// ── CLI ──────────────────────────────────────────────────────────────────────
const rawArgs = process.argv.slice(2);
const flags = Object.fromEntries(
  rawArgs
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v = "true"] = a.slice(2).split("=");
      return [k, v] as const;
    })
);
const slugArgs = rawArgs.filter((a) => !a.startsWith("--"));
const SLUGS = slugArgs.length > 0 ? slugArgs : [...SUTTAS];

// −20% "Slower" (live) and −7.5% "Faster" (fast/) — the two player paces.
const SLOW_ATEMPO = flags.slow ?? "0.8333"; // ≈1/1.2 → duration ×1.2
const FAST_ATEMPO = flags.fast ?? "0.925"; // playback 92.5%
const SKIP_AUDIOBOOK = flags["skip-audiobook"] !== undefined;

// ── Types ──────────────────────────────────────────────────────────────────────
type Section = {
  id: string;
  title: string;
  file: string;
  duration_sec: number;
  duration_fast_sec?: number;
  [k: string]: unknown;
};
type Manifest = {
  slug: string;
  locale: string;
  voice: string;
  model: string;
  generated_at: string;
  sections: Section[];
  [k: string]: unknown;
};

// ── ffmpeg / ffprobe ─────────────────────────────────────────────────────────
function atempo(srcAbs: string, dstAbs: string, rate: string): void {
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-i", srcAbs, "-filter:a", `atempo=${rate}`, "-y", dstAbs],
    { encoding: "utf8" }
  );
  if (r.status !== 0) throw new Error(`ffmpeg atempo=${rate} failed for ${srcAbs}\n${r.stderr}`);
}

function probe(absPath: string): number {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", absPath],
    { encoding: "utf8" }
  );
  const d = parseFloat(r.stdout.trim());
  return isFinite(d) ? Math.round(d * 10) / 10 : 0;
}

function readManifest(path: string): Manifest | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as Manifest;
}

// ── Per-sutta pipeline ───────────────────────────────────────────────────────
function renderSutta(slug: string): void {
  const slugDir = join(ROOT, "public", "audio", LOCALE, slug);
  const candidatesDir = join(slugDir, "candidates");
  const fastDir = join(slugDir, "fast");
  const manifestPath = join(slugDir, "manifest.json");

  // Snapshot the EXISTING manifest first — generate-audio rewrites it body-only,
  // so this is how we recover the card sections to preserve.
  const before = readManifest(manifestPath);
  const cardSections = before
    ? before.sections // filtered below once we know which ids were regenerated
    : [];

  // 1. RAW body narration (Theo Silk) → live dir, body-only manifest.
  console.log(`\n━━━ ${slug}: generating raw body narration ━━━`);
  const gen = spawnSync(
    process.execPath,
    ["--import", "tsx", join(ROOT, "scripts", "generate-audio.ts"), slug, LOCALE, "--force"],
    { stdio: "inherit", env: process.env }
  );
  if (gen.status !== 0) throw new Error(`generate-audio failed for ${slug} (exit ${gen.status})`);

  const after = readManifest(manifestPath);
  if (!after) throw new Error(`no manifest after generate-audio for ${slug}`);
  const bodySections = after.sections;
  const bodyIds = new Set(bodySections.map((s) => s.id));

  mkdirSync(candidatesDir, { recursive: true });
  mkdirSync(fastDir, { recursive: true });

  // 2–3. orig master → −20% live → −7.5% fast, per body clip.
  console.log(`  ${slug}: stretching ${bodySections.length} body clips (−20% live, −7.5% fast)`);
  for (const s of bodySections) {
    const livePath = join(slugDir, s.file); // currently RAW (from generate-audio)
    const origPath = join(candidatesDir, `orig-${s.file}`);
    const fastPath = join(fastDir, s.file);

    copyFileSync(livePath, origPath); // raw master
    atempo(origPath, livePath, SLOW_ATEMPO); // overwrite live with −20%
    atempo(origPath, fastPath, FAST_ATEMPO); // −7.5% variant

    s.duration_sec = probe(livePath);
    s.duration_fast_sec = probe(fastPath);
  }

  // 4. Merge: updated bodies + preserved cards (anything not regenerated),
  //    ordered by filename (00-title < 00b-preface < 01.. < 99-drop).
  const preserved = cardSections.filter((s) => !bodyIds.has(s.id));
  const merged = [...bodySections, ...preserved].sort((a, b) =>
    a.file < b.file ? -1 : a.file > b.file ? 1 : 0
  );

  const out: Manifest = {
    slug,
    locale: LOCALE,
    voice: after.voice,
    model: after.model,
    generated_at: new Date().toISOString(),
    sections: merged,
  };
  writeFileSync(manifestPath, JSON.stringify(out, null, 2) + "\n");

  const keptNote = preserved.length
    ? ` · kept ${preserved.length} card(s): ${preserved.map((s) => s.id).join(", ")}`
    : "";
  console.log(`  ${slug}: manifest patched — ${bodySections.length} body section(s)${keptNote}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main(): void {
  console.log(
    `Rendering ${SLUGS.length} sutta(s): ${SLUGS.join(", ")}\n` +
      `  voice=Theo Silk (eleven_multilingual_v2) · slow=${SLOW_ATEMPO} (−20%) · fast=${FAST_ATEMPO} (−7.5%)`
  );

  for (const slug of SLUGS) {
    if (!SUTTAS.includes(slug as (typeof SUTTAS)[number])) {
      throw new Error(`Unknown sutta slug: ${slug} (not in SUTTAS)`);
    }
    renderSutta(slug);
  }

  if (SKIP_AUDIOBOOK) {
    console.log("\n✓ Audio rendered. Skipping audiobook (--skip-audiobook).");
    return;
  }

  console.log("\n━━━ Building + publishing the M4B audiobook ━━━");
  const book = spawnSync(
    process.execPath,
    ["--import", "tsx", join(ROOT, "scripts", "build-audiobook.ts")],
    { stdio: "inherit", env: process.env }
  );
  if (book.status !== 0) throw new Error(`build-audiobook failed (exit ${book.status})`);
  console.log("\n✓ Pipeline complete.");
}

main();
