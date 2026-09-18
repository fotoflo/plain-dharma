/**
 * Master the English site narration IN PLACE — the files plaindharma.com, the
 * Expo app and the M4B all play.
 *
 * Applies the shared chain in scripts/lib/master.ts to every section, in both
 * paces, so every surface sounds the same: level-matched section to section,
 * de-mudded, and encoded at 128 kbps instead of the 64 kbps the old `atempo()`
 * re-encode silently produced (ffmpeg's libmp3lame default for mono).
 *
 *   master (128k) ──[atempo]──> tone ──> level-match ──> compress ──> limit
 *                                                          ──> 128k CBR mp3
 *
 * Source per section: the raw ElevenLabs master in `candidates/orig-*.mp3`
 * when its duration is a clean 1.2× match for the live cut. When it isn't, the
 * master is stale or that cut was re-recorded separately — we then master the
 * EXISTING file in place without re-stretching it, so the audio that was
 * reviewed is the audio that ships.
 *
 * Writes nothing until a section's whole render succeeds, then swaps the file
 * in. Durations move by at most an encoder frame, and the manifest is patched
 * with the measured values afterwards so the player and the M4B chapter
 * offsets stay exact.
 *
 * ENGLISH ONLY. The Chinese narration is a different voice
 * (bU2VfAdiOb2Gv2eZWlFq) and this tone curve was auditioned against Theo Silk's
 * chest register — it must not be applied to zh without its own audition.
 *
 * Back up first — this overwrites the live files:
 *   pnpm archive-audio-takes
 *
 * Run: pnpm master-english-audio [slug ...] [--dry-run]
 *      (no slugs → every unit, including front matter/closing/colophon)
 */

import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SUTTAS } from "@plain-dharma/content";
import {
  COMPRESSOR,
  FAST_ATEMPO,
  LIMITER,
  PEAK_CEILING_DB,
  SAMPLE_RATE,
  SECTION_TARGET_LUFS,
  SLOW_ATEMPO,
  TARGET_RMS_DB,
  duration,
  loudness,
  measure,
  run,
  toneFilters,
} from "./lib/master.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_DIR = join(ROOT, "public", "audio", "en");
// Match the raw ElevenLabs masters. The old pipeline re-encoded without -b:a
// and libmp3lame's mono default halved this to 64k on every file.
const BITRATE = "128k";
// A live/master duration ratio outside this band means the master is stale.
const STRETCH_MIN = 1.18;
const STRETCH_MAX = 1.22;

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const only = args.filter((a) => !a.startsWith("--"));
const UNITS =
  only.length > 0 ? only : ["_frontmatter", ...SUTTAS, "_closing", "_colophon"];

type Section = { id: string; file: string; duration_sec: number; duration_fast_sec?: number };
type Manifest = { sections: Section[]; [k: string]: unknown };

/**
 * The chain, end to end, for one file. Three passes: tone (then read gated
 * loudness), level-match + compress (then read RMS), final gain + limit.
 */
function masterFile(src: string, dst: string, atempo?: string): { rms: number; peak: number } {
  const tmpA = `${dst}.stage1.wav`;
  const tmpB = `${dst}.stage2.wav`;
  const tmpOut = `${dst}.new.mp3`;
  try {
    run("ffmpeg", [
      "-hide_banner", "-loglevel", "error",
      "-i", src,
      "-filter:a", toneFilters(atempo).join(","),
      "-ac", "1", "-ar", SAMPLE_RATE, "-c:a", "pcm_f32le",
      "-y", tmpA,
    ]);

    const gainToCommon = SECTION_TARGET_LUFS - loudness(tmpA);
    run("ffmpeg", [
      "-hide_banner", "-loglevel", "error",
      "-i", tmpA,
      "-filter:a", `volume=${gainToCommon.toFixed(2)}dB,${COMPRESSOR}`,
      "-ac", "1", "-ar", SAMPLE_RATE, "-c:a", "pcm_f32le",
      "-y", tmpB,
    ]);

    const gainToTarget = TARGET_RMS_DB - measure(tmpB).rms;
    run("ffmpeg", [
      "-hide_banner", "-loglevel", "error",
      "-i", tmpB,
      "-filter:a", `volume=${gainToTarget.toFixed(2)}dB,${LIMITER}`,
      "-ac", "1", "-ar", SAMPLE_RATE,
      "-c:a", "libmp3lame", "-b:a", BITRATE,
      "-y", tmpOut,
    ]);

    const level = measure(tmpOut);
    // Swap in only once the whole render succeeded.
    if (!DRY_RUN) renameSync(tmpOut, dst);
    return level;
  } finally {
    for (const f of [tmpA, tmpB, tmpOut]) rmSync(f, { force: true });
  }
}

function main(): void {
  let done = 0;
  const warnings: string[] = [];
  const beforeLevels: number[] = [];
  const afterLevels: number[] = [];

  for (const unit of UNITS) {
    const dir = join(AUDIO_DIR, unit);
    const manifestPath = join(dir, "manifest.json");
    if (!existsSync(manifestPath)) {
      warnings.push(`${unit}: no manifest, skipped`);
      continue;
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
    console.log(`\n${unit}`);

    for (const section of manifest.sections) {
      const fileName = section.file.split("?")[0].split("/").pop()!;
      const live = join(dir, fileName);
      const fast = join(dir, "fast", fileName);
      const master = join(dir, "candidates", `orig-${fileName}`);
      if (!existsSync(live)) throw new Error(`Missing live audio: ${live}`);

      // Is the master the thing this live cut was actually made from?
      let useMaster = existsSync(master);
      if (useMaster) {
        const ratio = duration(live) / duration(master);
        if (ratio < STRETCH_MIN || ratio > STRETCH_MAX) {
          useMaster = false;
          warnings.push(
            `${unit}/${fileName}: master is ${ratio.toFixed(3)}× the live cut, not 1.2× — ` +
              `mastered the existing file in place instead`
          );
        }
      } else {
        warnings.push(`${unit}/${fileName}: no master on disk — mastered the existing file`);
      }

      beforeLevels.push(measure(live).rms);

      // Slow (live) pace, then the fast variant if this surface has one.
      const slow = masterFile(useMaster ? master : live, live, useMaster ? SLOW_ATEMPO : undefined);
      afterLevels.push(slow.rms);
      if (slow.peak > PEAK_CEILING_DB) {
        warnings.push(`${unit}/${fileName}: peak ${slow.peak.toFixed(1)} dBFS over ceiling`);
      }

      let fastSecs: number | undefined;
      if (existsSync(fast)) {
        masterFile(useMaster ? master : fast, fast, useMaster ? FAST_ATEMPO : undefined);
        fastSecs = DRY_RUN ? section.duration_fast_sec : Number(duration(fast).toFixed(1));
      }

      // Keep the manifest honest: the encoder can shift length by a frame, and
      // the M4B chapter offsets are computed from these numbers.
      const liveSecs = DRY_RUN ? section.duration_sec : Number(duration(live).toFixed(1));
      const drift = Math.abs(liveSecs - section.duration_sec);
      if (drift > 0.35) {
        warnings.push(
          `${unit}/${fileName}: duration moved ${drift.toFixed(2)}s ` +
            `(${section.duration_sec} → ${liveSecs}) — check the take`
        );
      }
      section.duration_sec = liveSecs;
      if (fastSecs !== undefined) section.duration_fast_sec = fastSecs;

      console.log(
        `  ${fileName.padEnd(44)} ${beforeLevels.at(-1)!.toFixed(1)} → ${slow.rms.toFixed(1)} dB RMS` +
          `   peak ${slow.peak.toFixed(1)}${useMaster ? "" : "   (from existing cut)"}`
      );
      done++;
    }

    if (!DRY_RUN) {
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    }
  }

  const spread = (xs: number[]): string => (Math.max(...xs) - Math.min(...xs)).toFixed(1);
  console.log(
    `\n[master-english-audio] ${done} section(s)${DRY_RUN ? " (DRY RUN — nothing written)" : ""}`
  );
  console.log(
    `[master-english-audio] level spread: ${spread(beforeLevels)} dB before → ${spread(afterLevels)} dB after`
  );
  if (warnings.length) {
    console.log(`\n[master-english-audio] ${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  ! ${w}`);
  }
  if (!DRY_RUN) {
    console.log(
      `\nNext: pnpm build-audiobook && pnpm build-remix-assets && pnpm upload-assets`
    );
  }
}

main();
