/**
 * The Plain Dharma narration mastering chain — ONE recipe, shared by every
 * surface so the site, the M4B and the retail audiobook all sound identical.
 *
 * Consumers:
 *   scripts/master-english-audio.ts    → public/audio/en/**  (site + app + M4B)
 *   scripts/build-spotify-audiobook.ts → dist/spotify/**     (retail delivery)
 *
 * ── Why these numbers ────────────────────────────────────────────────────────
 * Every section is a separate ElevenLabs render, so they arrive at different
 * levels: integrated loudness across the book measured −22.9 to −27.6 LUFS, a
 * 4.7 LU spread that is plainly audible as the chapters go by. Theo Silk also
 * carries a heavy chest register — the 80–160 Hz fundamental sat ~5 dB above
 * every other band, masking consonants and tiring the ear over a 50-minute sit.
 * And a ~20 dB crest factor makes the retail RMS floor unreachable by gain
 * alone.
 *
 * What we deliberately do NOT do, because measurement said not to: no
 * denoising (noise floor is already −77 dB, far under the −60 dB stores ask
 * for), no DC correction (offset is 0.00003), no EQ beyond the high-pass and
 * the one shelf.
 *
 * ── Verifying a change ───────────────────────────────────────────────────────
 * The shelf figure was chosen by ear from a gain-matched audition and then
 * pinned by measurement. Its target is **−9.7 dB under 160 Hz relative to
 * programme level**. If you change LOW_SHELF or COMPRESSOR, re-measure:
 *
 *   full=$(ffmpeg -i FILE -af volumedetect -f null - 2>&1 | grep mean_volume)
 *   low=$(ffmpeg  -i FILE -af "lowpass=f=160,lowpass=f=160,volumedetect" \
 *                 -f null - 2>&1 | grep mean_volume)
 *   # low − full should be ≈ −9.7 dB
 *
 * Note the shelf interacts with the compressor: placed BEFORE it (as here) the
 * shelf must do all the work, because the compressor is no longer ducking the
 * whole signal on bass peaks. Moving it after the compressor would need about
 * −5 dB instead of −7 for the same result.
 */

import { spawnSync } from "node:child_process";

// ── Tone ─────────────────────────────────────────────────────────────────────
/** Cascaded 2-pole sections give 24 dB/oct — a single pole left too much mud. */
export const HIGHPASS_HZ = 100;
/** Clears the chest without thinning the voice. A meditative reading should
 *  still feel embodied; this is not a news bulletin. */
export const LOW_SHELF = "bass=g=-7:f=220:width_type=q:w=0.7";
/** Sibilant transients peak ~7 dB under the full-band peak. Light touch only —
 *  the 128k source has limited HF already, and heavy de-essing lisps. */
export const DEESS = "deesser=i=0.12:m=0.4:f=0.5";

// ── Dynamics ─────────────────────────────────────────────────────────────────
/** Common working level before assembly. Gated (LUFS), not raw RMS: the long
 *  mindfulness sections are pause-heavy and an ungated measure would wrongly
 *  shove them up. */
export const SECTION_TARGET_LUFS = -24;
/** Gentle, slow, RMS-detected — evens the book out without audible pumping.
 *  `threshold` is linear in ffmpeg: 0.1 = −20 dBFS. */
export const COMPRESSOR =
  "acompressor=threshold=0.1:ratio=2.5:attack=8:release=180:knee=6:detection=rms";

// ── Delivery level ───────────────────────────────────────────────────────────
/** Mid of Spotify's −23…−18 dBRMS band; also a comfortable web level. */
export const TARGET_RMS_DB = -20.5;
export const RMS_FLOOR_DB = -23;
export const RMS_ROOF_DB = -18;
/** The spec figure, and what we verify the finished file against. */
export const PEAK_CEILING_DB = -3;
/**
 * The limiter aims LOWER than the ceiling, because it works on float samples
 * and the lossy encode that follows overshoots them. Measured: at 128 kbps a
 * float-domain −3.0 dBFS limit came back as −2.6 to −2.9 dBFS in the encoded
 * file (192 kbps overshot less, landing at −3.0 to −3.2). 0.5 dB of headroom
 * covers both bitrates with room to spare.
 */
const LIMIT_HEADROOM_DB = 0.5;
/** alimiter takes a linear ceiling, not dB. */
export const LIMITER = `alimiter=limit=${(
  10 ** ((PEAK_CEILING_DB - LIMIT_HEADROOM_DB) / 20)
).toFixed(4)}:attack=5:release=50:level=0`;

export const SAMPLE_RATE = "44100";

// ── Pace ─────────────────────────────────────────────────────────────────────
/** The two player paces (render-english-audio.ts). Always applied ONCE, to a
 *  raw master — compounding atempo passes degrades quality. */
export const SLOW_ATEMPO = "0.8333"; // −20%, the default "Slower"
export const FAST_ATEMPO = "0.925"; // −7.5%, the "Faster" option

/**
 * A live cut should be its master stretched by 1.2× (atempo 0.8333). When the
 * ratio falls outside this band the master is stale, or that cut was
 * re-recorded separately — use the existing file instead, so the audio that was
 * reviewed is the audio that ships. Two sections currently fail this check:
 * fire-sermon/02-the-same-fire-everywhere (1.250×) and
 * loving-kindness/00-title (1.283×).
 */
export const STRETCH_MIN = 1.18;
export const STRETCH_MAX = 1.22;

export type Level = { rms: number; peak: number };

export function run(bin: string, args: string[]): string {
  const r = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
  if (r.status !== 0) {
    throw new Error(`${bin} failed (${r.status})\n${args.join(" ")}\n${r.stderr}`);
  }
  // ffmpeg writes its measurements to stderr; callers may want either stream.
  return `${r.stdout}${r.stderr}`;
}

export function duration(file: string): number {
  return Number(
    run("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=nk=1:nw=1",
      file,
    ]).trim()
  );
}

/** Ungated mean/peak — the shape Spotify states its spec in. */
export function measure(file: string): Level {
  const out = run("ffmpeg", ["-hide_banner", "-i", file, "-af", "volumedetect", "-f", "null", "-"]);
  const rms = Number(/mean_volume:\s*(-?[\d.]+) dB/.exec(out)?.[1]);
  const peak = Number(/max_volume:\s*(-?[\d.]+) dB/.exec(out)?.[1]);
  if (Number.isNaN(rms) || Number.isNaN(peak)) throw new Error(`volumedetect failed for ${file}`);
  return { rms, peak };
}

/** EBU R128 integrated loudness — gated, so pauses don't drag it down. Falls
 *  back to ungated RMS for clips too short or too sparse for R128 gating. */
export function loudness(file: string): number {
  const out = run("ffmpeg", [
    "-hide_banner", "-nostats",
    "-i", file,
    "-af", "ebur128",
    "-f", "null", "-",
  ]);
  const lufs = Number(/I:\s*(-?[\d.]+) LUFS/.exec(out.split("Integrated loudness").pop() ?? "")?.[1]);
  return Number.isFinite(lufs) ? lufs : measure(file).rms;
}

const AFORMAT = `aformat=sample_fmts=fltp:sample_rates=${SAMPLE_RATE}:channel_layouts=mono`;

/**
 * For a source that has ALREADY been through this chain — the mastered site
 * files. Re-running the tone stage would double the shelf (−14 dB of bass) and
 * de-ess twice, leaving those sections thin against the rest of the book.
 */
export function passthroughFilters(): string[] {
  return [AFORMAT];
}

/**
 * Stage one filters: optional time-stretch, then tone. Run this, then read the
 * gated loudness of the RESULT — the level match has to reflect the audio the
 * listener actually gets, not the audio before EQ.
 */
export function toneFilters(atempo?: string): string[] {
  const filters = [AFORMAT];
  if (atempo) filters.push(`atempo=${atempo}`);
  filters.push(`highpass=f=${HIGHPASS_HZ}`, `highpass=f=${HIGHPASS_HZ}`, LOW_SHELF, DEESS);
  return filters;
}
