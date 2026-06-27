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
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { getSuttasInOrder, DEFAULT_LOCALE } from "@plain-dharma/content";
import { getAudioManifest } from "../src/content/audio.js";
import {
  ORIGINAL_AUTHOR,
  TRANSLATOR,
  BYLINE,
  BOOK_TITLE,
  PUBLISHER,
} from "./lib/book-source.js";
import { publishToDownloads } from "./lib/publish.js";

const SUTTAS_IN_ORDER = getSuttasInOrder(DEFAULT_LOCALE);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_DIR = join(ROOT, "public", "audio", "en");
// Spoken title/credits intro, prepended as the opening chapter (audiobook-only).
const FRONTMATTER_DIR = join(AUDIO_DIR, "_frontmatter");
// Spoken "how this was made" + contribute colophon, appended as the closing
// chapter (audiobook-only). Source: src/content/en_tts/colophon.mdx.
const COLOPHON_DIR = join(AUDIO_DIR, "_colophon");
// Spoken reading send-off ("Closing"), played after the last sutta and before the
// colophon. Source: src/content/en_tts/closing.mdx.
const CLOSING_DIR = join(AUDIO_DIR, "_closing");
const OUT_DIR = join(ROOT, "dist", "audiobook");
// Use the SQUARE cover — audiobook players (Apple Books, Audible, Spotify) want
// 1:1 art, not the 6×9 cover.jpg. generate-front-cover.ts emits this 3000² JPG.
const COVER_PATH = join(ROOT, "dist", "ebook", "audiobook-cover.jpg");

// AAC bitrate. 64k mono is the speech-podcast sweet spot — clear, ~half the
// MP3 source size. Audiobook listening doesn't benefit from higher bitrates.
const AAC_BITRATE = "64k";

// Silent breath inserted between top-level units (front matter, preface, each
// sutta, colophon) so chapters don't run together. Folded into the *trailing*
// edge of the preceding chapter so the chapter timeline stays contiguous.
const GAP_MS = 1500;

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

  // A 1.5s silent breath between top-level units. Folded into the trailing edge
  // of the preceding chapter so the timeline stays gap-free for players.
  const silencePath = ensureSilence(GAP_MS);
  const pushGap = (): void => {
    concat.push({ filePath: silencePath, durationMs: GAP_MS });
    cursorMs += GAP_MS;
    if (chapters.length) chapters[chapters.length - 1]!.endMs = cursorMs;
  };

  // Front matter (spoken title/credits) opens the book as chapter 1, titled
  // with the book title. Skipped gracefully if it hasn't been generated.
  const fmManifestPath = join(FRONTMATTER_DIR, "manifest.json");
  if (existsSync(fmManifestPath)) {
    const fm = JSON.parse(readFileSync(fmManifestPath, "utf8")) as {
      sections: { file: string; duration_sec: number }[];
    };
    for (const section of fm.sections) {
      const fileName = section.file.split("?")[0].split("/").pop()!;
      const filePath = join(FRONTMATTER_DIR, fileName);
      if (!existsSync(filePath)) throw new Error(`Missing front-matter audio: ${filePath}`);
      const durationMs = Math.round(section.duration_sec * 1000);
      concat.push({ filePath, durationMs });
      chapters.push({ title: BOOK_TITLE, startMs: cursorMs, endMs: cursorMs + durationMs });
      cursorMs += durationMs;
    }
  } else {
    console.warn(`[build-audiobook] no front matter at ${fmManifestPath} — building without an intro.`);
  }

  // Preface (the narrative — "After waking under the Bodhi tree…") plays as its
  // own chapter BEFORE chapter one. It physically lives in the first-talk
  // manifest as a "preface" section, so we hoist it here and skip it in the
  // suttas loop below.
  const firstTalk = await getAudioManifest("en", "first-talk");
  const prefaceSection = firstTalk?.sections.find((s) => s.id === "preface");
  if (prefaceSection) {
    const fileName = prefaceSection.file.split("?")[0].split("/").pop()!;
    const filePath = join(AUDIO_DIR, "first-talk", fileName);
    if (!existsSync(filePath)) throw new Error(`Missing preface audio: ${filePath}`);
    const durationMs = Math.round(prefaceSection.duration_sec * 1000);
    pushGap();
    concat.push({ filePath, durationMs });
    chapters.push({ title: "Preface", startMs: cursorMs, endMs: cursorMs + durationMs });
    cursorMs += durationMs;
  }

  for (const meta of SUTTAS_IN_ORDER) {
    const manifest = await getAudioManifest("en", meta.slug);
    if (!manifest) {
      throw new Error(`No manifest for ${meta.slug} — run \`pnpm generate-audio\` first.`);
    }
    const short = SHORT_TITLES[meta.slug] ?? meta.title;
    pushGap();
    for (const section of manifest.sections) {
      // The preface is hoisted to play before chapter one (see above) — don't
      // also emit it inline as first-talk's second track.
      if (meta.slug === "first-talk" && section.id === "preface") continue;
      // Since the offsite-asset migration, getAudioManifest resolves `file` to a
      // full Supabase CDN URL (with a `?v=` cache-bust). The audiobook stitches
      // the LOCAL mp3s, so take the basename — works for a URL or a bare name.
      const fileName = section.file.split("?")[0].split("/").pop()!;
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

  // Closing (the spoken reading send-off) plays after the last sutta, before the
  // colophon. Skipped gracefully if it hasn't been generated.
  const closingManifestPath = join(CLOSING_DIR, "manifest.json");
  if (existsSync(closingManifestPath)) {
    const cl = JSON.parse(readFileSync(closingManifestPath, "utf8")) as {
      sections: { file: string; duration_sec: number }[];
    };
    pushGap();
    for (const section of cl.sections) {
      const fileName = section.file.split("?")[0].split("/").pop()!;
      const filePath = join(CLOSING_DIR, fileName);
      if (!existsSync(filePath)) throw new Error(`Missing closing audio: ${filePath}`);
      const durationMs = Math.round(section.duration_sec * 1000);
      concat.push({ filePath, durationMs });
      chapters.push({ title: "Closing", startMs: cursorMs, endMs: cursorMs + durationMs });
      cursorMs += durationMs;
    }
  } else {
    console.warn(`[build-audiobook] no closing at ${closingManifestPath} — building without a send-off.`);
  }

  // Colophon (spoken "how this was made" + contribute) closes the book as the
  // final chapter. Skipped gracefully if it hasn't been generated.
  const colManifestPath = join(COLOPHON_DIR, "manifest.json");
  if (existsSync(colManifestPath)) {
    const col = JSON.parse(readFileSync(colManifestPath, "utf8")) as {
      sections: { file: string; duration_sec: number }[];
    };
    pushGap();
    for (const section of col.sections) {
      const fileName = section.file.split("?")[0].split("/").pop()!;
      const filePath = join(COLOPHON_DIR, fileName);
      if (!existsSync(filePath)) throw new Error(`Missing colophon audio: ${filePath}`);
      const durationMs = Math.round(section.duration_sec * 1000);
      concat.push({ filePath, durationMs });
      chapters.push({ title: "How This Book Was Made", startMs: cursorMs, endMs: cursorMs + durationMs });
      cursorMs += durationMs;
    }
  } else {
    console.warn(`[build-audiobook] no colophon at ${colManifestPath} — building without a closing chapter.`);
  }

  return { concat, chapters };
}

// Generate (and cache) a silent MP3 of `ms` milliseconds for inter-chapter
// gaps. The concat step re-encodes to AAC, so a mono lavfi-sourced clip mixes
// fine with the Theo Silk takes. No-op if already generated this build.
function ensureSilence(ms: number): string {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const out = join(OUT_DIR, `silence-${ms}ms.mp3`);
  if (!existsSync(out)) {
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-f", "lavfi",
        "-i", "anullsrc=r=44100:cl=mono",
        "-t", (ms / 1000).toString(),
        "-q:a", "9",
        out,
      ],
      { stdio: ["ignore", "ignore", "inherit"] }
    );
  }
  return out;
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
    // The author is the Buddha; Claude Opus translated, Alex Miller edited.
    // M4B has no editor/translator role, so artist = author, composer = translator,
    // and the full credit lives in the comment.
    `artist=${ORIGINAL_AUTHOR}`,
    `album=${BOOK_TITLE}`,
    `album_artist=${ORIGINAL_AUTHOR}`,
    `composer=${TRANSLATOR}`,
    `genre=Religion/Spirituality`,
    `date=${new Date().getFullYear()}`,
    `publisher=${PUBLISHER}`,
    `comment=Plain Dharma — six foundational Buddhist suttas in modern English. ${BYLINE}. CC0 public domain.`,
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

  // Publishing is tied to generation — push the just-built audiobook to the site.
  publishToDownloads(outPath, "plain-dharma.m4b");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
