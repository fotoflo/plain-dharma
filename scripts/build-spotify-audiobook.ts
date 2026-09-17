/**
 * Build + master the audiobook delivery package for Spotify + ACX.
 *
 * Both retailers take one file per chapter at 44.1 kHz / 192 kbps CBR with
 * peak ≤ −3 dBFS and RMS between −23 and −18 dBRMS. Our live site files are
 * 64 kbps mono — below that floor — so this script rebuilds each chapter
 * from the 128 kbps raw ElevenLabs masters in
 * `public/audio/en/<unit>/candidates/orig-*.mp3`. Same output serves both
 * retailers — the audio files are identical.
 *
 * ── Why there is a mastering pass ────────────────────────────────────────────
 * Every section was a separate TTS render, so they arrive at different levels:
 * measured across the book, integrated loudness spans −22.9 to −27.6 LUFS (a
 * 4.7 LU spread), which is plainly audible as the chapters go by. The raw takes
 * also carry ~10 dB of sub-70 Hz energy that is not voice, and a ~20 dB crest
 * factor that makes it impossible to reach the RMS floor by gain alone.
 *
 * What we do NOT do, because measurement said not to: no denoising (the noise
 * floor is already −77 dB, far under the −60 dB stores ask for), no DC
 * correction (offset is 0.00003), no EQ shaping beyond the high-pass.
 *
 *   per section:  [atempo −20%] → high-pass 75 Hz → light de-ess
 *                 → gain to a common −24 LUFS        (fixes the 4.7 LU spread)
 *   per chapter:  concat → gentle 2.5:1 compression  (tames the 20 dB crest)
 *                 → gain to −20.5 dBRMS → limit at −3 dBFS → 192 kbps CBR
 *
 * All intermediate stages are 32-bit float, so the only lossy step is the final
 * encode: masters (128k) → float → one 192k CBR encode.
 *
 * Per-section fallback: if a master's duration doesn't line up with its live
 * file at 1.2×, the master is stale or the live cut was re-recorded separately.
 * In that case the LIVE file is used verbatim (and not re-stretched), so we
 * always ship exactly the audio that was reviewed.
 *
 * Chapters: 10 top-level units (front matter, preface, six suttas, closing,
 * colophon) — the book's own table of contents. The 37-section granularity of
 * the M4B would put 16-second chapters on a retail shelf.
 *
 * Retail sample: a single retail-sample.mp3 at dist/acx-and-spotify/ that
 * works for BOTH retailers. Stitched from the just-built chapters:
 *   - 14s of credits chapter (title + byline: "translated by Claude Opus,
 *     edited by Alex Miller")
 *   - full Preface (1:18)
 *   - first 3:26 of First Talk
 * Total: 4:58, within both retailers' 5-minute sample cap. The seam lands at
 * the deer-park scene boundary — Preface ends on "Their resolve melted
 * before he said a word" and First Talk opens at "At Varanasi, in the deer
 * park at Isipatana…" Spotify and ACX both allow this length; the sample
 * is intentionally identical for both.
 *
 * Deliberately does NOT publish to public/downloads: these are retailer
 * delivery assets, not reader downloads. The reader-facing equivalents are
 * plain-dharma.m4b and plain-dharma-audio-en.zip.
 *
 * Output: dist/acx-and-spotify/  (chapter mp3s, retail-sample.mp3, cover.jpg,
 *         chapters.csv, upload-manifest.json)
 *
 * Requires: ffmpeg + ffprobe in PATH.
 * Run: pnpm build-spotify
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { getSuttasInOrder, DEFAULT_LOCALE } from "@plain-dharma/content";
import { BOOK_TITLE, BOOK_SUBTITLE, BYLINE } from "./lib/book-source.js";
import {
  COMPRESSOR,
  DEESS,
  HIGHPASS_HZ,
  LIMITER,
  LOW_SHELF,
  PEAK_CEILING_DB,
  RMS_FLOOR_DB,
  RMS_ROOF_DB,
  SAMPLE_RATE,
  SECTION_TARGET_LUFS,
  SLOW_ATEMPO,
  STRETCH_MAX,
  STRETCH_MIN,
  TARGET_RMS_DB,
  duration,
  loudness,
  measure,
  run,
  passthroughFilters,
  toneFilters,
} from "./lib/master.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_DIR = join(ROOT, "public", "audio", "en");
const OUT_DIR = join(ROOT, "dist", "acx-and-spotify");
const TMP_DIR = join(OUT_DIR, ".tmp");
const COVER_SRC = join(ROOT, "dist", "audiobook", "audiobook-cover.jpg");

// ── Delivery spec (Spotify for Authors) ──────────────────────────────────────
// Everything about how the audio SOUNDS lives in scripts/lib/master.ts, shared
// with the site render. Only the retail container differs here.
const BITRATE = "192k";
// Head/tail padding so chapters don't start or end abruptly in a retail player.
// The site files get none — their durations have to match the manifest.
const HEAD_MS = 250;
const TAIL_MS = 1000;

type Section = { id: string; title: string; file: string; duration_sec: number };
type Manifest = { sections: Section[] };
type Source = { path: string; fromMaster: boolean; note?: string };
type Chapter = { index: number; title: string; sources: Source[] };




function readManifest(unit: string): Manifest {
  const path = join(AUDIO_DIR, unit, "manifest.json");
  if (!existsSync(path)) throw new Error(`No manifest for ${unit} at ${path}`);
  return JSON.parse(readFileSync(path, "utf8")) as Manifest;
}

/**
 * Pick the best source for one section: the 128k master when it's a clean
 * 1.2× match for the live file, otherwise the live file verbatim.
 */
function resolveSource(unit: string, section: Section): Source {
  const fileName = section.file.split("?")[0].split("/").pop()!;
  const live = join(AUDIO_DIR, unit, fileName);
  if (!existsSync(live)) throw new Error(`Missing live audio: ${live}`);
  const master = join(AUDIO_DIR, unit, "candidates", `orig-${fileName}`);
  if (!existsSync(master)) {
    return { path: live, fromMaster: false, note: "no master on disk" };
  }
  const ratio = duration(live) / duration(master);
  if (ratio < STRETCH_MIN || ratio > STRETCH_MAX) {
    return {
      path: live,
      fromMaster: false,
      note: `master is ${ratio.toFixed(3)}× the live cut, not 1.2× — stale or re-recorded`,
    };
  }
  return { path: master, fromMaster: true };
}

function sectionsOf(unit: string, filter?: (s: Section) => boolean): Source[] {
  return readManifest(unit)
    .sections.filter((s) => filter?.(s) ?? true)
    .map((s) => resolveSource(unit, s));
}

function buildChapterList(): Chapter[] {
  const chapters: Chapter[] = [];
  const push = (title: string, sources: Source[]): void => {
    chapters.push({ index: chapters.length + 1, title, sources });
  };

  // Opening credits — title, byline, what's inside, the public-domain grant.
  // Spotify caps the credits track at 2 minutes; this one runs ~1:45.
  push(BOOK_TITLE, sectionsOf("_frontmatter"));

  // The preface lives inside the first-talk manifest but plays as its own
  // chapter before chapter one (same hoist as build-audiobook.ts).
  push("Preface", sectionsOf("first-talk", (s) => s.id === "preface"));

  for (const meta of getSuttasInOrder(DEFAULT_LOCALE)) {
    push(
      `${meta.ordinal}. ${meta.title}`,
      sectionsOf(meta.slug, (s) => !(meta.slug === "first-talk" && s.id === "preface"))
    );
  }

  push("Closing", sectionsOf("_closing"));
  push("How This Book Was Made", sectionsOf("_colophon"));

  return chapters;
}

/**
 * Stage one: clean each section and measure it. Time-stretch (masters only),
 * high-pass, de-ess — then read the gated loudness of the RESULT, so the gain
 * we work out in stage two reflects what the listener will actually hear.
 */
function prepareSection(src: Source, out: string): number {
  run("ffmpeg", [
    "-hide_banner", "-loglevel", "error",
    "-i", src.path,
    // A fallback source is a mastered site file — already tone-shaped and
    // already at pace. Only masters go through the tone stage here.
    "-filter:a", (src.fromMaster ? toneFilters(SLOW_ATEMPO) : passthroughFilters()).join(","),
    "-ac", "1", "-ar", SAMPLE_RATE, "-c:a", "pcm_f32le",
    "-y", out,
  ]);

  // loudness() already falls back to ungated RMS for clips too short or too
  // sparse for R128 gating, so a section is never left at whatever level it
  // happened to arrive at.
  return loudness(out);
}

/** Stage two: level-match every section, then glue them into one chapter. */
function assembleChapter(parts: { path: string; gainDb: number }[], out: string): void {
  const inputs = parts.flatMap((p) => ["-i", p.path]);
  const graph = [
    ...parts.map((p, i) => `[${i}:a]volume=${p.gainDb.toFixed(2)}dB[g${i}]`),
    `${parts.map((_, i) => `[g${i}]`).join("")}concat=n=${parts.length}:v=0:a=1[out]`,
  ].join(";");

  run("ffmpeg", [
    "-hide_banner", "-loglevel", "error",
    ...inputs,
    "-filter_complex", graph,
    "-map", "[out]",
    "-ac", "1", "-ar", SAMPLE_RATE, "-c:a", "pcm_f32le",
    "-y", out,
  ]);
}

function main(): void {
  if (!existsSync(COVER_SRC)) {
    throw new Error(`No square cover at ${COVER_SRC} — run \`pnpm render-covers\` first.`);
  }
  rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(TMP_DIR, { recursive: true });

  const chapters = buildChapterList();
  const rows: Record<string, unknown>[] = [];
  const warnings: string[] = [];
  const spread: number[] = [];

  for (const chapter of chapters) {
    const slug = chapter.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const name = `${String(chapter.index).padStart(2, "0")}-${slug}.mp3`;
    const outPath = join(OUT_DIR, name);

    // ── Sections: clean, measure, level-match ────────────────────────────────
    const parts = chapter.sources.map((src, i) => {
      const path = join(TMP_DIR, `ch${chapter.index}-${i}.wav`);
      const lufs = prepareSection(src, path);
      spread.push(lufs);
      return { path, gainDb: SECTION_TARGET_LUFS - lufs };
    });

    const raw = join(TMP_DIR, `ch${chapter.index}.wav`);
    assembleChapter(parts, raw);
    parts.forEach((p) => rmSync(p.path, { force: true }));

    // ── Chapter: compress, then measure what compression left us ────────────
    const squashed = join(TMP_DIR, `ch${chapter.index}-comp.wav`);
    run("ffmpeg", [
      "-hide_banner", "-loglevel", "error",
      "-i", raw,
      "-filter:a", COMPRESSOR,
      "-ac", "1", "-ar", SAMPLE_RATE, "-c:a", "pcm_f32le",
      "-y", squashed,
    ]);
    rmSync(raw, { force: true });

    const before = measure(squashed);
    const gain = TARGET_RMS_DB - before.rms;

    // ── Final: gain to target, limit the few remaining peaks, encode ────────
    run("ffmpeg", [
      "-hide_banner", "-loglevel", "error",
      "-i", squashed,
      "-af",
      [
        `volume=${gain.toFixed(2)}dB`,
        LIMITER,
        `adelay=${HEAD_MS}`,
        `apad=pad_dur=${TAIL_MS / 1000}`,
      ].join(","),
      "-ac", "1", "-ar", SAMPLE_RATE,
      "-c:a", "libmp3lame", "-b:a", BITRATE,
      "-y", outPath,
    ]);
    rmSync(squashed, { force: true });

    // ── Verify against the published spec ───────────────────────────────────
    const after = measure(outPath);
    const lufs = loudness(outPath);
    const secs = duration(outPath);
    if (after.rms < RMS_FLOOR_DB || after.rms > RMS_ROOF_DB) {
      warnings.push(`${name}: RMS ${after.rms.toFixed(1)} dB is outside Spotify's −23…−18 band`);
    }
    if (after.peak > PEAK_CEILING_DB) {
      warnings.push(`${name}: peak ${after.peak.toFixed(1)} dBFS is above the −3 dBFS ceiling`);
    }
    for (const src of chapter.sources.filter((s) => !s.fromMaster)) {
      warnings.push(`${name}: ${src.path.split("/").pop()} came from the mastered site file — ${src.note}`);
    }

    const mmss = `${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, "0")}`;
    rows.push({
      chapter: chapter.index,
      file: name,
      title: chapter.title,
      duration_sec: Number(secs.toFixed(1)),
      duration: mmss,
      bytes: statSync(outPath).size,
      rms_db: Number(after.rms.toFixed(1)),
      peak_db: Number(after.peak.toFixed(1)),
      lufs: Number(lufs.toFixed(1)),
      crest_db: Number((after.peak - after.rms).toFixed(1)),
      from_masters: chapter.sources.every((s) => s.fromMaster),
    });
    console.log(
      `  ${String(chapter.index).padStart(2)}. ${chapter.title.slice(0, 36).padEnd(38)}` +
        `${mmss.padStart(6)}   RMS ${after.rms.toFixed(1)}   peak ${after.peak.toFixed(1)}   ` +
        `${lufs.toFixed(1)} LUFS`
    );
  }

  // Retail sample: 14s of credits chapter (title + byline) + full Preface +
  // first 3:26 of First Talk = 4:58 total. Works for both Spotify and ACX.
  // The seam lands at the deer-park scene boundary, just before the Buddha
  // begins to speak. See docs/publishing/ACX_PUBLISHING.md for the full
  // rationale and the policy citation.
  const creditsPath = join(OUT_DIR, rows[0].file as string);
  const prefacePath = join(OUT_DIR, rows[1].file as string);
  const firstTalkPath = join(OUT_DIR, rows[2].file as string);
  const samplePath = join(OUT_DIR, "retail-sample.mp3");
  run("ffmpeg", [
    "-hide_banner", "-loglevel", "error",
    "-ss", "0", "-t", "14", "-i", creditsPath,
    "-i", prefacePath,
    "-ss", "0", "-t", "206", "-i", firstTalkPath,
    "-filter_complex", "[0:a][1:a][2:a]concat=n=3:v=0:a=1[a]",
    "-map", "[a]",
    "-c:a", "libmp3lame", "-b:a", BITRATE,
    "-ar", "44100", "-ac", "1",
    "-y", samplePath,
  ]);
  console.log(`[build-spotify] retail-sample.mp3: 14s credits + full preface (${Math.round(rows[1].duration_sec as number)}s) + 3:26 first talk = ~4:58`);
  copyFileSync(COVER_SRC, join(OUT_DIR, "cover.jpg"));

  const header = Object.keys(rows[0]).join(",");
  const body = rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(",")).join("\n");
  writeFileSync(join(OUT_DIR, "chapters.csv"), `${header}\n${body}\n`, "utf8");

  const totalSec = rows.reduce((n, r) => n + (r.duration_sec as number), 0);
  const lufsValues = rows.map((r) => r.lufs as number);
  writeFileSync(
    join(OUT_DIR, "upload-manifest.json"),
    `${JSON.stringify(
      {
        title: BOOK_TITLE,
        subtitle: BOOK_SUBTITLE,
        byline: BYLINE,
        built_at: new Date().toISOString(),
        spec: { bitrate: BITRATE, sample_rate: 44100, channels: 1, container: "mp3" },
        mastering: {
          highpass_hz: HIGHPASS_HZ,
          low_shelf: LOW_SHELF,
          deesser: DEESS,
          section_target_lufs: SECTION_TARGET_LUFS,
          compressor: COMPRESSOR,
          target_rms_db: TARGET_RMS_DB,
          peak_ceiling_db: PEAK_CEILING_DB,
          section_lufs_spread_before: Number((Math.max(...spread) - Math.min(...spread)).toFixed(1)),
          chapter_lufs_spread_after: Number(
            (Math.max(...lufsValues) - Math.min(...lufsValues)).toFixed(1)
          ),
        },
        runtime: `${Math.floor(totalSec / 60)}m ${Math.round(totalSec % 60)}s`,
        chapters: rows,
        warnings,
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  rmSync(TMP_DIR, { recursive: true, force: true });

  console.log(
    `\n[build-spotify] ${rows.length} chapters · ${Math.floor(totalSec / 60)}m ` +
      `${Math.round(totalSec % 60)}s · ${(rows.reduce((n, r) => n + (r.bytes as number), 0) / 1e6).toFixed(1)} MB`
  );
  console.log(
    `[build-spotify] loudness spread: sections ${(Math.max(...spread) - Math.min(...spread)).toFixed(1)} LU ` +
      `in → chapters ${(Math.max(...lufsValues) - Math.min(...lufsValues)).toFixed(1)} LU out`
  );
  console.log(`[build-spotify] wrote ${OUT_DIR}`);
  if (warnings.length) {
    console.log(`\n[build-spotify] ${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  ! ${w}`);
  }
}

main();
