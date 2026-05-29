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
      "-background", "white", "-flatten",
      "-strip",
      "-quality", "92",
      cover,
    ],
    { stdio: "inherit" }
  );
  rmSync(tmpPng, { force: true });

  console.log(`[generate-cover] wrote ${cover} from ${SOURCE_PDF}`);

  // Publishing is tied to generation — push the just-built cover to the site.
  publishToDownloads(cover, "plain-dharma-cover.jpg");

  console.log(`[generate-cover] now run \`pnpm build-ebook\` / \`build-pdf\` to attach it.`);
}

main();
