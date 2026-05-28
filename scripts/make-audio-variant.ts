/**
 * Render an alternate-speed audio variant for every sutta from the *raw*
 * ElevenLabs originals (candidates/orig-*.mp3), then patch each manifest with
 * the variant's measured per-section durations.
 *
 * Why from orig-* and not the live files: the live `public/audio/en/<slug>/*.mp3`
 * are themselves already time-stretched (the -20% meditative pace, atempo≈0.833).
 * Re-stretching those would compound atempo passes and degrade quality. Every
 * speed rendition must derive from the untouched originals.
 *
 * Usage:
 *   tsx scripts/make-audio-variant.ts [locale] [variant] [atempo]
 *
 * Defaults: locale=en variant=fast atempo=0.925   (the -7.5% "faster" pace)
 *
 * For each <slug> dir that has both a manifest.json and candidates/orig-*.mp3:
 *   candidates/orig-01-opening.mp3  --(atempo)-->  <variant>/01-opening.mp3
 * and writes `duration_<variant>_sec` onto the matching manifest section.
 *
 * Purely additive: never touches the live files or the orig candidates.
 * Requires: ffmpeg + ffprobe in PATH.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

const [localeArg, variantArg, atempoArg] = process.argv.slice(2);
const LOCALE = localeArg ?? "en";
const VARIANT = variantArg ?? "fast";
const ATEMPO = atempoArg ?? "0.925";

const DURATION_KEY = `duration_${VARIANT}_sec`;

type ManifestSection = {
  id: string;
  title: string;
  file: string;
  duration_sec: number;
  [k: string]: unknown;
};
type Manifest = { sections: ManifestSection[]; [k: string]: unknown };

function probeDuration(absPath: string): number | null {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", absPath],
    { encoding: "utf8" }
  );
  if (r.status !== 0) return null;
  const d = parseFloat(r.stdout.trim());
  return isFinite(d) ? Math.round(d * 10) / 10 : null;
}

function render(origAbs: string, outAbs: string): boolean {
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-i", origAbs, "-filter:a", `atempo=${ATEMPO}`, "-y", outAbs],
    { encoding: "utf8" }
  );
  if (r.status !== 0) {
    console.error(`  ffmpeg failed for ${origAbs}\n${r.stderr}`);
    return false;
  }
  return true;
}

function main() {
  const localeDir = join(ROOT, "public", "audio", LOCALE);
  if (!existsSync(localeDir)) {
    console.error(`No audio dir for locale "${LOCALE}": ${localeDir}`);
    process.exit(1);
  }

  console.log(`Variant "${VARIANT}" · atempo=${ATEMPO} · locale=${LOCALE}\n`);

  let totalFiles = 0;
  for (const slug of readdirSync(localeDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)) {
    const slugDir = join(localeDir, slug);
    const manifestPath = join(slugDir, "manifest.json");
    const candidatesDir = join(slugDir, "candidates");
    if (!existsSync(manifestPath) || !existsSync(candidatesDir)) continue;

    const origFiles = readdirSync(candidatesDir).filter(
      (f) => f.startsWith("orig-") && f.endsWith(".mp3")
    );
    if (origFiles.length === 0) continue;

    const outDir = join(slugDir, VARIANT);
    mkdirSync(outDir, { recursive: true });

    const durations = new Map<string, number>(); // base filename -> duration
    for (const orig of origFiles) {
      const base = orig.replace(/^orig-/, ""); // 01-opening.mp3
      const outAbs = join(outDir, base);
      if (!render(join(candidatesDir, orig), outAbs)) continue;
      const dur = probeDuration(outAbs);
      if (dur != null) durations.set(base, dur);
      totalFiles++;
    }

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
    let patched = 0;
    for (const sec of manifest.sections) {
      const dur = durations.get(sec.file);
      if (dur != null) {
        sec[DURATION_KEY] = dur;
        patched++;
      }
    }
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`${slug}: ${durations.size} clips → ${VARIANT}/, patched ${patched} sections`);
  }

  console.log(`\nDone. Rendered ${totalFiles} ${VARIANT} files.`);
}

main();
