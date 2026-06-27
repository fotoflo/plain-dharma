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

// pdftoppm rasterizes the CMYK InDesign PDF to RGB with no ICC profile. A prior
// pass pulled saturation to 72 (−28%) to tame a hot-orange cast, but per the
// owner's call the sun now renders at full saturation (no lightening) for the
// richer, more vivid orange. Dial toward 72 for the muted amber.
const SATURATION = 100;
// The baked InDesign sun renders as a deep, intense orange (core ≈ srgb(245,151,29))
// that looks over-saturated next to the softer audiobook sun. Desaturate ONLY the
// sun's region so the global SATURATION above stays 100 (gold stripe keeps its
// richness). Saturation is a *proportional* scale, so it barely touches the low-sat
// cream that surrounds the sun in this region → no rectangular seam. (Brightness is
// an absolute lift and WOULD seam the cream, so we leave it at 100.)
const SUN_SATURATION = 84;
const SUN_REGION = "700x680+500+850"; // sun bbox (x563–1138, y893–1461) + cream margin

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

  // Soften + lift the sun region only (see SUN_* notes above).
  const sunRegion = join(OUT_DIR, "sun-region.png");
  execFileSync("magick", [cover, "-crop", SUN_REGION, "+repage",
    "-modulate", `100,${SUN_SATURATION},100`, sunRegion], { stdio: "inherit" });
  const sunOffset = SUN_REGION.slice(SUN_REGION.indexOf("+")); // "+500+850"
  execFileSync("magick", [cover, "-gravity", "NorthWest",
    "(", sunRegion, ")", "-geometry", sunOffset, "-composite",
    "-quality", "92", cover], { stdio: "inherit" });
  rmSync(sunRegion, { force: true });

  // The InDesign source bakes the byline as a bare "Alex Miller". The book is
  // credited to the Buddha (author); the work was "translated & edited by Alex
  // Miller & Claude Opus". We erase the baked name and stamp a fresh credit block
  // (small italic eyebrow over the large combined names) so every surface that
  // consumes cover.jpg (PDF cover page, EPUB/Kindle, audiobook art, download
  // image) carries the same honest credit.
  //
  // Geometry is measured against the 1600×2400 raster above: the baked "Alex
  // Miller" sits at content-center x≈853 (not image-center — the ~130px gold
  // stripe shifts it), y≈1818, with the URL just below at y≈2009. We sample a
  // clean cream swatch from empty cover area (right of the name) and scale it
  // over the baked name (matching JPEG texture → no seam), then composite the new
  // block centered on the content axis. Revisit these if TARGET_W or the InDesign
  // layout changes.
  // Type sizes follow standard cover hierarchy (rule of thirds; non-celebrity
  // author byline ≈ 0.5–0.6× the title). The baked title "Plain Dharma" has
  // cap-height ≈ 100px; GaramondLibre renders cap ≈ 0.73× pointsize.
  //   • Names at pt86  → cap ≈ 63px. A long two-name byline is WIDTH-constrained,
  //     so the names STACK; each line then stays under 0.75× the title width
  //     (635px) — "& Claude Opus" ≈ 565px at pt86 — while the type runs large.
  //   • Eyebrow at pt40 → cap ≈ 29px (italic, lightly tracked).
  //   • URL at pt52     → cap ≈ 38px (a quiet footer).
  // All four credit lines are trimmed to their ink and stacked with EVEN whitespace
  // grouped by role so the credit is HONEST: Claude Opus translated (from the Pāli),
  // Alex Miller edited — not "both did both". Each role is a small italic eyebrow
  // tight above its name; the two role+name groups (and the URL) are separated by a
  // larger, even gap (Gestalt proximity: role binds to its name).
  const CONTENT_CX = 853; // content axis (offset from image center by the gold stripe)
  const SUN_BOTTOM = 1461; // watercolor sun's base (measured)
  const BAKED_URL_TOP = 2009; // where the InDesign source bakes the URL (we blot + restamp it)
  const BOTTOM_MARGIN = 150; // credit block's footer margin from the canvas foot (2400)
  const NAME_PT = 86;
  const EYE_PT = 40;
  const URL_PT = 52;
  const TIGHT = 14; // role eyebrow → its name (within a group)
  const GROUP = 50; // between the two role+name groups
  const URL_GAP = 92; // names → URL: extra breathing room so the URL reads as a footer
  const eyebrowFont = join(ROOT, "src/app/fonts/GaramondLibre-Italic.otf");
  const nameFont = join(ROOT, "src/app/fonts/GaramondLibre-Regular.otf");
  const creamSwatch = join(OUT_DIR, "cream-swatch.png");
  const tightImg = join(OUT_DIR, "gap-tight.png");
  const groupImg = join(OUT_DIR, "gap-group.png");
  const urlGapImg = join(OUT_DIR, "gap-url.png");
  const eyebrow1Img = join(OUT_DIR, "eyebrow1.png");
  const name1Img = join(OUT_DIR, "name1.png");
  const eyebrow2Img = join(OUT_DIR, "eyebrow2.png");
  const name2Img = join(OUT_DIR, "name2.png");
  const urlImg = join(OUT_DIR, "url.png");
  const creditBlock = join(OUT_DIR, "credit-block.png");

  // Render each credit line to its own ink-trimmed image.
  const line = (out: string, font: string, pt: number, text: string, kerning: number) =>
    execFileSync("magick", ["-background", "none", "-fill", "#1a1a1a", "-font", font,
      "-pointsize", String(pt), "-kerning", String(kerning), `label:${text}`,
      "-trim", "+repage", out], { stdio: "inherit" });
  line(eyebrow1Img, eyebrowFont, EYE_PT, "translated by", 2);
  line(name1Img, nameFont, NAME_PT, "Claude Opus", 0);
  line(eyebrow2Img, eyebrowFont, EYE_PT, "edited by", 2);
  line(name2Img, nameFont, NAME_PT, "Alex Miller", 0);
  line(urlImg, nameFont, URL_PT, "plaindharma.com", 1);

  // Stack centered: each role tight above its name, a larger gap between the two
  // groups, and a larger gap still before the URL so it sits apart as a footer.
  execFileSync("magick", ["-size", `1x${TIGHT}`, "xc:none", tightImg], { stdio: "inherit" });
  execFileSync("magick", ["-size", `1x${GROUP}`, "xc:none", groupImg], { stdio: "inherit" });
  execFileSync("magick", ["-size", `1x${URL_GAP}`, "xc:none", urlGapImg], { stdio: "inherit" });
  execFileSync("magick", ["-background", "none", "-gravity", "center",
    eyebrow1Img, tightImg, name1Img, groupImg, eyebrow2Img, tightImg, name2Img, urlGapImg, urlImg,
    "-append", "-trim", "+repage", creditBlock], { stdio: "inherit" });
  const [bw, bh] = execFileSync("magick", ["identify", "-format", "%w %h", creditBlock])
    .toString().trim().split(" ").map(Number);

  // Placement. Default "footer": the whole credit (eyebrow → names → URL) is one
  // evenly-spaced block grounded at the foot — the squint test favours this over the
  // textbook "byline under image + URL footer" here, because the sun sits high and
  // the lower half is sparse, which strands a mid-band byline. BYLINE_PLACE=undersun
  // anchors the same block just below the sun instead.
  const place = process.env.BYLINE_PLACE === "undersun" ? "undersun" : "footer";
  const blockTop = place === "undersun"
    ? SUN_BOTTOM + Math.round(NAME_PT * 0.73 * 2.0)
    : 2400 - BOTTOM_MARGIN - bh;
  const blockX = Math.round(CONTENT_CX - bw / 2);

  // Cream swatch from an empty patch to the right of the baked name; reused to blot
  // both the baked "Alex Miller" and the baked URL (matching JPEG texture → no seam).
  execFileSync("magick", [cover, "-crop", "140x140+1240+1770", "+repage", creamSwatch], { stdio: "inherit" });
  execFileSync(
    "magick",
    [
      cover, "-gravity", "NorthWest",
      "(", creamSwatch, "-resize", "560x210!", ")", "-geometry", "+573+1755", "-composite", // erase baked name
      "(", creamSwatch, "-resize", "520x120!", ")", "-geometry", `+610+${BAKED_URL_TOP - 18}`, "-composite", // erase baked URL
      "(", creditBlock, ")", "-geometry", `+${blockX}+${blockTop}`, "-composite",
      "-quality", "92", cover,
    ],
    { stdio: "inherit" }
  );
  for (const f of [creamSwatch, tightImg, groupImg, urlGapImg, eyebrow1Img, name1Img, eyebrow2Img, name2Img, urlImg, creditBlock]) rmSync(f, { force: true });

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
