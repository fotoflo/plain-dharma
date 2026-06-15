/**
 * Build dist/ebook/cover.jpg by rasterizing the designer's cover.
 *
 * Source of truth: scripts/assets/PlainDharma_Cover.pdf — the InDesign cover,
 * 6×9" (2:3), CMYK. This JPEG is the single cover artifact consumed by
 * build-pdf (cover page), build-ebook (EPUB/Kindle cover), build-audiobook
 * (album art), and publish-downloads (the standalone book image).
 *
 * pdftoppm (poppler) does the PDF→raster step — ImageMagick has no PDF decode
 * delegate on this machine — rendering at a high DPI; ImageMagick then
 * downscales to the target width (supersampling for clean edges) and converts
 * CMYK→sRGB so the JPEG displays correctly in browsers and e-readers.
 *
 * Run: pnpm generate-cover
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { publishToDownloads } from "./lib/publish.js";

const __filename = fileURLToPath(import.meta.url);
const ROOT = join(dirname(__filename), "..");
const OUT_DIR = join(ROOT, "dist", "ebook");
const SOURCE_PDF = join(ROOT, "scripts/assets/PlainDharma_Cover.pdf");

// 6×9 cover → 2:3. 1600×2400 fills the 6×9 PDF page and is a valid KDP/EPUB
// cover (≥1600px tall side). Render at 320 DPI (~1920×2880), then downscale.
const TARGET_W = 1600;
const RENDER_DPI = 320;

// pdftoppm rasterizes the CMYK InDesign PDF to RGB with no ICC profile, which
// blows the watercolor sun out to a hot orange (far more saturated than the
// designer's intent). Pull saturation back to land on the softer amber. 72 =
// −28% saturation; dial toward 100 for more orange, lower for more muted gold.
const SATURATION = 72;

function main(): void {
  if (!existsSync(SOURCE_PDF)) {
    console.error(`ERROR: missing cover PDF at ${SOURCE_PDF}`);
    process.exit(1);
  }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  // pdftoppm with -singlefile writes <prefix>.png (no page-number suffix).
  const tmpPrefix = join(OUT_DIR, "cover-render");
  const tmpPng = `${tmpPrefix}.png`;
  execFileSync(
    "pdftoppm",
    ["-png", "-r", String(RENDER_DPI), "-singlefile", SOURCE_PDF, tmpPrefix],
    { stdio: "inherit" }
  );

  const cover = join(OUT_DIR, "cover.jpg");
  execFileSync(
    "magick",
    [
      tmpPng,
      "-resize", `${TARGET_W}x`,
      "-colorspace", "sRGB",
      "-modulate", `100,${SATURATION},100`,
      "-background", "white", "-flatten",
      "-strip",
      "-quality", "92",
      cover,
    ],
    { stdio: "inherit" }
  );
  rmSync(tmpPng, { force: true });

  // The InDesign source prints the byline as a bare "Alex Miller". Now that the
  // book is credited to the Buddha (author) with Alex as the translator, stamp a
  // small "translated by" eyebrow above the name so every surface that consumes
  // cover.jpg (PDF cover page, EPUB/Kindle, audiobook art, download image)
  // carries the honest credit.
  //
  // We also nudge the whole byline down SHIFT px so it sits closer to the URL.
  // "Alex Miller" is baked into the raster on flat cream, so we lift its band and
  // set it down lower, erasing the old spot with a clean cream patch sampled from
  // empty cover area (matching JPEG texture → no seam). Geometry is measured
  // against the 1600×2400 raster above: "Alex Miller" at (661,1818) — content-
  // center x≈853, not image-center, because of the ~130px gold stripe — and the
  // URL at (647,2009). Revisit these if TARGET_W or the InDesign layout changes.
  const SHIFT = 64;
  const eyebrowFont = join(ROOT, "src/app/fonts/GaramondLibre-Italic.otf");
  const nameBand = join(OUT_DIR, "name-band.png");
  const creamPatch = join(OUT_DIR, "cream-patch.png");
  execFileSync("magick", [cover, "-crop", "600x100+550+1800", "+repage", nameBand], { stdio: "inherit" });
  execFileSync("magick", [cover, "-crop", "600x100+550+2150", "+repage", creamPatch], { stdio: "inherit" });
  execFileSync(
    "magick",
    [
      cover, "-gravity", "NorthWest",
      creamPatch, "-geometry", "+550+1800", "-composite",
      nameBand, "-geometry", `+550+${1800 + SHIFT}`, "-composite",
      "(", "-background", "none", "-fill", "#1a1a1a",
      "-font", eyebrowFont, "-pointsize", "32", "label:translated by", ")",
      "-geometry", `+770+${1748 + SHIFT}`, "-composite",
      "-quality", "92", cover,
    ],
    { stdio: "inherit" }
  );
  rmSync(nameBand, { force: true });
  rmSync(creamPatch, { force: true });

  // Kindle's *ideal* cover ratio is 1.6:1 (1600×2560); the 6×9 source is 1.5:1.
  // Pad the byline'd cover into a Kindle-only variant (the other consumers keep
  // the native 6×9 proportion — upload this one to KDP). Replicate the top/bottom
  // edge rows (which are clean cream + full-height gold stripe, no text) rather
  // than centering on a solid fill, so the stripe runs edge-to-edge instead of
  // floating with cream gaps in the corners.
  const kindleCover = join(OUT_DIR, "cover-kindle.jpg");
  execFileSync(
    "magick",
    [
      cover,
      "-virtual-pixel", "edge",
      "-set", "option:distort:viewport", "1600x2560-0-80",
      "-distort", "SRT", "0",
      "+repage", "-strip", "-quality", "92", kindleCover,
    ],
    { stdio: "inherit" }
  );

  console.log(`[generate-cover] wrote ${cover} (+ ${kindleCover}) from ${SOURCE_PDF}`);

  // Publishing is tied to generation — push the just-built cover to the site.
  publishToDownloads(cover, "plain-dharma-cover.jpg");

  console.log(`[generate-cover] now run \`pnpm build-ebook\` / \`build-pdf\` to attach it.`);
}

main();
