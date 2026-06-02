/**
 * Publish the raw source assets into public/downloads so the /remix page can
 * offer them for download without sending people to GitHub or making them
 * grab tracks one at a time:
 *
 *   public/downloads/text/<locale>/<slug>.mdx       — per-file text grabs
 *   public/downloads/plain-dharma-text.zip          — the whole text corpus
 *   public/downloads/plain-dharma-audio-<locale>.zip — every narration track
 *
 * The MDX in packages/content/{en,zh}/ is the source of truth (see CLAUDE.md);
 * this script copies it verbatim — frontmatter and all — so a downloaded file
 * is identical to what the repo ships. The audio zips bundle the same per-track
 * mp3s the page links individually (top-level tracks only — the candidates/ and
 * fast/ working files are skipped). Re-run after editing text or regenerating
 * audio.
 *
 * Run: pnpm build-remix-assets
 */

import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SUPPORTED_LOCALES, SUTTAS } from "@plain-dharma/content";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = join(ROOT, "packages", "content");
const AUDIO_DIR = join(ROOT, "public", "audio");
const DOWNLOADS_DIR = join(ROOT, "public", "downloads");
const TEXT_DIR = join(DOWNLOADS_DIR, "text");
const ZIP_PATH = join(DOWNLOADS_DIR, "plain-dharma-text.zip");

function sizeLabel(absPath: string): string {
  const bytes = statSync(absPath).size;
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`;
}

// 1. Copy every <locale>/<slug>.mdx into public/downloads/text/<locale>/.
//    Wipe the target first so a removed sutta/locale doesn't linger.
rmSync(TEXT_DIR, { recursive: true, force: true });
let copied = 0;
for (const locale of SUPPORTED_LOCALES) {
  for (const slug of SUTTAS) {
    const src = join(CONTENT_DIR, locale, `${slug}.mdx`);
    if (!existsSync(src)) {
      console.warn(`[remix] skip ${locale}/${slug}.mdx — source missing`);
      continue;
    }
    const destDir = join(TEXT_DIR, locale);
    mkdirSync(destDir, { recursive: true });
    copyFileSync(src, join(destDir, `${slug}.mdx`));
    copied += 1;
  }
}
console.log(`[remix] copied ${copied} .mdx → public/downloads/text/`);

// 2. Bundle the whole text corpus into one zip. Run zip from inside TEXT_DIR so
//    the archive holds clean relative paths (en/first-talk.mdx, …) with no
//    public/downloads prefix. -r recurse, -X drop extra macOS attributes.
rmSync(ZIP_PATH, { force: true });
execFileSync("zip", ["-r", "-X", "-q", ZIP_PATH, "."], { cwd: TEXT_DIR });
console.log(`[remix] public/downloads/plain-dharma-text.zip  ${sizeLabel(ZIP_PATH)}`);

// 3. Bundle each locale's narration into one zip, holding only the top-level
//    per-section mp3s (the same tracks the page links) laid out as
//    <slug>/<track>.mp3. Stage the files first so the archive is clean of the
//    candidates/ and fast/ working dirs and any stray manifests. The stage dir
//    lives outside public/downloads so it's never served.
const AUDIO_STAGE = join(ROOT, ".remix-audio-stage");
rmSync(AUDIO_STAGE, { recursive: true, force: true });
for (const locale of SUPPORTED_LOCALES) {
  let tracks = 0;
  for (const slug of SUTTAS) {
    const srcDir = join(AUDIO_DIR, locale, slug);
    if (!existsSync(srcDir)) continue;
    const mp3s = readdirSync(srcDir).filter((f) => f.endsWith(".mp3"));
    if (mp3s.length === 0) continue;
    const destDir = join(AUDIO_STAGE, locale, slug);
    mkdirSync(destDir, { recursive: true });
    for (const file of mp3s) {
      copyFileSync(join(srcDir, file), join(destDir, file));
      tracks += 1;
    }
  }
  const localeStage = join(AUDIO_STAGE, locale);
  if (!existsSync(localeStage)) {
    console.warn(`[remix] no audio for ${locale} — skipping zip`);
    continue;
  }
  const zipPath = join(DOWNLOADS_DIR, `plain-dharma-audio-${locale}.zip`);
  rmSync(zipPath, { force: true });
  execFileSync("zip", ["-r", "-X", "-q", zipPath, "."], { cwd: localeStage });
  console.log(
    `[remix] public/downloads/plain-dharma-audio-${locale}.zip  ` +
      `${tracks} tracks, ${sizeLabel(zipPath)}`
  );
}
rmSync(AUDIO_STAGE, { recursive: true, force: true });
