/**
 * Build the Plain Dharma audiobook as a single M4B file with chapter markers.
 *
 * Pipeline:
 *   1. Read each per-sutta manifest from public/audio/en/ in canonical order
 *   2. Build an ffmpeg concat list of all MP3 files
 *   3. Build an FFMETADATA1 chapters file from the section durations
 *   4. Run ffmpeg: concat MP3s → re-encode to AAC → wrap in MP4 (.m4b) →
 *      attach cover.jpg → embed chapter markers
 *
 * Chapter scheme: one chapter per section (37 total). Titles prefixed with
 * the sutta ordinal so the chapter list reads as a flat hierarchy in players
 * that don't render groups (most don't). Format: "N. Sutta · Section".
 *
 * Output: dist/audiobook/plain-dharma.m4b
 *
 * Run: pnpm build-audiobook
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { getSuttasInOrder, DEFAULT_LOCALE } from "@plain-dharma/content";
import { getAudioManifest } from "../src/content/audio.js";
import { AUTHOR, BOOK_TITLE, PUBLISHER } from "./lib/book-source.js";

const SUTTAS_IN_ORDER = getSuttasInOrder(DEFAULT_LOCALE);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_DIR = join(ROOT, "public", "audio", "en");
const OUT_DIR = join(ROOT, "dist", "audiobook");
const COVER_PATH = join(ROOT, "dist", "ebook", "cover.jpg");

// AAC bitrate. 64k mono is the speech-podcast sweet spot — clear, ~half the
// MP3 source size. Audiobook listening doesn't benefit from higher bitrates.
const AAC_BITRATE = "64k";

// Short labels for chapter prefixes — the sutta titles in SUTTA_META include
// "The Buddha's First Talk" etc. which gets long when prefixed with the
// section name. Compress them for the chapter list.
const SHORT_TITLES: Record<string, string> = {
  "first-talk":      "First Talk",
  "not-self":        "Not-Self",
  "fire-sermon":     "Fire Sermon",
  "loving-kindness": "Loving-Kindness",
  mindfulness:       "Mindfulness",
  "how-to-decide":   "How to Decide",
};

type Chapter = {
  title: string;
  startMs: number;
  endMs: number;
};

type ConcatEntry = {
  filePath: string;
  durationMs: number;
};

async function gather(): Promise<{ concat: ConcatEntry[]; chapters: Chapter[] }> {
  const concat: ConcatEntry[] = [];
  const chapters: Chapter[] = [];
  let cursorMs = 0;

  for (const meta of SUTTAS_IN_ORDER) {
    const manifest = await getAudioManifest("en", meta.slug);
    if (!manifest) {
      throw new Error(`No manifest for ${meta.slug} — run \`pnpm generate-audio\` first.`);
    }
    const short = SHORT_TITLES[meta.slug] ?? meta.title;
    for (const section of manifest.sections) {
      // getAudioManifest appends a `?v=<mtime>` cache-bust query to `file` for
      // the browser; strip it to get the real on-disk filename.
      const fileName = section.file.split("?")[0];
      const filePath = join(AUDIO_DIR, meta.slug, fileName);
      if (!existsSync(filePath)) {
        throw new Error(`Missing audio file: ${filePath}`);
      }
      const durationMs = Math.round(section.duration_sec * 1000);
      concat.push({ filePath, durationMs });
      chapters.push({
        title: `${meta.ordinal}. ${short} · ${section.title}`,
        startMs: cursorMs,
        endMs: cursorMs + durationMs,
      });
      cursorMs += durationMs;
    }
  }
  return { concat, chapters };
}

function writeConcatList(entries: ConcatEntry[]): string {
  // ffmpeg concat demuxer format: `file '<path>'` per line, quoted to handle
  // any spaces / special chars in absolute paths.
  const body = entries
    .map((e) => `file '${e.filePath.replace(/'/g, "'\\''")}'`)
    .join("\n");
  const out = join(OUT_DIR, "concat.txt");
  writeFileSync(out, body + "\n");
  return out;
}

function writeChaptersMetadata(chapters: Chapter[]): string {
  // FFMETADATA1 format. Album-level tags go before any [CHAPTER] block.
  const header = [
    ";FFMETADATA1",
    `title=${BOOK_TITLE}`,
    `artist=${AUTHOR}`,
    `album=${BOOK_TITLE}`,
    `album_artist=${AUTHOR}`,
    `composer=${AUTHOR}`,
    `genre=Religion/Spirituality`,
    `date=${new Date().getFullYear()}`,
    `publisher=${PUBLISHER}`,
    `comment=Plain Dharma — six foundational Buddhist suttas in plain modern English. CC0 public domain.`,
  ].join("\n");

  const chapterBlocks = chapters
    .map((c) =>
      [
        "[CHAPTER]",
        "TIMEBASE=1/1000",
        `START=${c.startMs}`,
        `END=${c.endMs}`,
        // Escape `=`, `;`, `#`, `\` and newlines per FFMETADATA spec.
        `title=${c.title.replace(/[\\=;#\n]/g, (m) => `\\${m}`)}`,
      ].join("\n")
    )
    .join("\n\n");

  const body = `${header}\n\n${chapterBlocks}\n`;
  const out = join(OUT_DIR, "chapters.txt");
  writeFileSync(out, body);
  return out;
}

function runFfmpeg(concatPath: string, chaptersPath: string): string {
  const outPath = join(OUT_DIR, "plain-dharma.m4b");
  // Two inputs:
  //   0: concat demuxer (audio stream)
  //   1: chapters metadata
  //   2: cover.jpg (attached_pic) — only if cover exists
  const hasCover = existsSync(COVER_PATH);
  const args = [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", concatPath,
    "-i", chaptersPath,
  ];
  if (hasCover) {
    args.push("-i", COVER_PATH);
  }
  // Map: take audio from input 0, metadata from input 1, cover from input 2.
  args.push("-map", "0:a");
  if (hasCover) {
    args.push("-map", "2:v");
    args.push("-disposition:v:0", "attached_pic");
    args.push("-c:v", "mjpeg");
  }
  args.push(
    "-map_metadata", "1",
    "-c:a", "aac",
    "-b:a", AAC_BITRATE,
    "-movflags", "+faststart",
    outPath
  );

  execFileSync("ffmpeg", args, { stdio: ["ignore", "ignore", "inherit"] });
  return outPath;
}

async function main(): Promise<void> {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const { concat, chapters } = await gather();
  const totalSec = chapters[chapters.length - 1]!.endMs / 1000;
  console.log(
    `[build-audiobook] ${concat.length} sections, ${chapters.length} chapters, ` +
      `${(totalSec / 60).toFixed(1)} min`
  );

  const concatPath = writeConcatList(concat);
  const chaptersPath = writeChaptersMetadata(chapters);
  if (!existsSync(COVER_PATH)) {
    console.warn(
      `[build-audiobook] no cover at ${COVER_PATH} — building without art. ` +
        `Run \`pnpm generate-cover\` first to embed one.`
    );
  }

  const outPath = runFfmpeg(concatPath, chaptersPath);
  const sizeMb = (statSync(outPath).size / (1024 * 1024)).toFixed(1);
  console.log(`[build-audiobook] wrote ${outPath} (${sizeMb} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
