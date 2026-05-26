/**
 * Make the near-white cream backgrounds of public/illustrations/*.png transparent.
 *
 * Why: Gemini's generated illustrations come back with a ~#FCFCFC / #FAF7EE
 * background that doesn't match the page (#F5EFE0). On the page they show as
 * visible squares with a slightly lighter cream than the surroundings.
 *
 * What this does:
 *  - Detects near-white, near-grayscale pixels (saturation low, luma high).
 *  - Replaces them with transparency, with a smooth alpha fade at the edge
 *    so the saffron watercolor wash feathers naturally instead of hard-cutting.
 *  - Leaves solid black line art and the saffron (#C7651C ≈ luma 0.43) intact.
 *
 * Strategy:
 *  - Prefer ImageMagick (`magick` on PATH), which has a fast pixel `-fx` engine.
 *  - Fallback to `sharp` (transitive Next.js dep) with raw RGBA buffer math.
 *
 * Run with: pnpm transparentize-illustrations
 *
 * Skips any file < 10KB (those would be leftover placeholders).
 * Writes to a temp path then atomically renames in place.
 */
import { execFile } from "node:child_process";
import {
  existsSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const ILLUSTRATIONS_DIR = join(ROOT, "public", "illustrations");

const MIN_SIZE_BYTES = 10 * 1024;

// Tuning constants — keep in sync between magick and sharp paths.
// Background luma threshold: above this, pixels start fading.
const LUMA_FADE_START = 0.86; // ~219/255 — light cream
const LUMA_FADE_END = 0.96; // ~245/255 — full transparency
// Saturation threshold: pixels above this are "colored" (saffron) and kept.
const SAT_MAX = 0.1; // ~25/255 channel spread

async function hasMagick(): Promise<boolean> {
  try {
    await execFileP("magick", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

async function processWithMagick(inPath: string, outPath: string): Promise<void> {
  // FX expression notes:
  //   r, g, b are normalized 0..1.
  //   luma = (r+g+b)/3
  //   sat  = max(r,g,b) - min(r,g,b)
  //   If luma > LUMA_FADE_START AND sat < SAT_MAX → fade alpha:
  //     alpha = max(0, 1 - (luma - START) / (END - START))
  //   else → alpha = 1
  const span = LUMA_FADE_END - LUMA_FADE_START;
  const fx =
    `(r+g+b)/3 > ${LUMA_FADE_START} && ` +
    `(max(max(r,g),b)-min(min(r,g),b)) < ${SAT_MAX} ` +
    `? max(0, 1 - ((r+g+b)/3 - ${LUMA_FADE_START})/${span}) ` +
    `: 1`;

  await execFileP("magick", [
    inPath,
    "-alpha",
    "set",
    "-channel",
    "alpha",
    "-fx",
    fx,
    outPath,
  ]);
}

// Minimal duck-typing for sharp — it's a transitive dep that may not have
// types installed in this project, but its runtime shape is stable.
type SharpInstance = {
  ensureAlpha: () => SharpInstance;
  raw: () => SharpInstance;
  png: () => SharpInstance;
  toBuffer: (opts: {
    resolveWithObject: true;
  }) => Promise<{
    data: Buffer;
    info: { width: number; height: number; channels: number };
  }>;
  toFile: (path: string) => Promise<unknown>;
};
type SharpFactory = (
  input: string | Buffer,
  opts?: { raw: { width: number; height: number; channels: number } },
) => SharpInstance;

async function processWithSharp(inPath: string, outPath: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sharpMod = (await import("sharp" as any)) as { default: SharpFactory };
  const sharp = sharpMod.default;

  const { data, info } = await sharp(inPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  if (channels !== 4) {
    throw new Error(`Expected 4 channels (RGBA), got ${channels}`);
  }

  const fadeStart = LUMA_FADE_START * 255;
  const fadeEnd = LUMA_FADE_END * 255;
  const fadeSpan = fadeEnd - fadeStart;
  const satMax = SAT_MAX * 255;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const luma = (r + g + b) / 3;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);

    if (luma > fadeStart && sat < satMax) {
      if (luma >= fadeEnd) {
        data[i + 3] = 0;
      } else {
        data[i + 3] = Math.round((1 - (luma - fadeStart) / fadeSpan) * 255);
      }
    }
    // else: leave alpha as-is (will be 255 from ensureAlpha)
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(outPath);
}

async function main() {
  if (!existsSync(ILLUSTRATIONS_DIR)) {
    console.error(`ERROR: ${ILLUSTRATIONS_DIR} does not exist`);
    process.exit(1);
  }

  const files = readdirSync(ILLUSTRATIONS_DIR).filter((f) => f.endsWith(".png"));
  if (files.length === 0) {
    console.log("No PNGs found in", ILLUSTRATIONS_DIR);
    return;
  }

  const useMagick = await hasMagick();
  console.log(
    `Using ${useMagick ? "ImageMagick" : "sharp"} ` +
      `(luma fade ${LUMA_FADE_START}–${LUMA_FADE_END}, sat<${SAT_MAX})`,
  );
  console.log(`Processing ${files.length} files in ${ILLUSTRATIONS_DIR}\n`);

  let processed = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const file of files) {
    const inPath = join(ILLUSTRATIONS_DIR, file);
    const tmpPath = `${inPath}.tmp.png`;

    const size = statSync(inPath).size;
    if (size < MIN_SIZE_BYTES) {
      console.log(`  skip ${file} (${size} bytes < ${MIN_SIZE_BYTES} threshold)`);
      skipped += 1;
      continue;
    }

    try {
      if (useMagick) {
        await processWithMagick(inPath, tmpPath);
      } else {
        await processWithSharp(inPath, tmpPath);
      }
      renameSync(tmpPath, inPath);
      const newSize = statSync(inPath).size;
      console.log(
        `  ok   ${file} (${size} → ${newSize} bytes)`,
      );
      processed += 1;
    } catch (err) {
      if (existsSync(tmpPath)) {
        try {
          unlinkSync(tmpPath);
        } catch {
          // ignore
        }
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  FAIL ${file}: ${msg}`);
      failures.push(`${file}: ${msg}`);
    }
  }

  console.log(
    `\nDone. processed=${processed} skipped=${skipped} failed=${failures.length}`,
  );
  if (failures.length > 0) {
    process.exit(2);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
