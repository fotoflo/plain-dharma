/**
 * Build a GENERATED Plain Dharma front cover from scripts/templates/front-cover.tex.
 *
 * Why this exists: the designer's InDesign front (scripts/assets/PlainDharma_Cover.pdf
 * → cover.jpg) is locked to 6×9. The 5×8 paperback needs a front at ratio 0.625,
 * and cropping the 6×9 raster would eat the gold spine stripe + centered title.
 * This reproduces that layout natively (vector Garamond + the watercolor sun
 * raster) so it renders crisp at any trim, and pairs with the generated back
 * cover (same cream, same gold stitched stripe).
 *
 * The sun art (scripts/assets/cover-artwork.png) is deepened (its source is paler
 * than the InDesign book cover's sun) and flattened onto cream before embedding.
 *
 * Output: dist/ebook/front-cover-print-color.jpg (5.25×8.25 = 5×8 + 0.125 bleed),
 * consumed by build-kdp as the wraparound's __FRONT_IMG__.
 *
 * Run: pnpm generate-front-cover
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { publishToDownloads } from "./lib/publish.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "dist", "ebook");
const FONTS_DIR = join(ROOT, "src", "app", "fonts");
const TEMPLATE = join(ROOT, "scripts", "templates", "front-cover.tex");
// Original watercolor sun art — a committed SOURCE asset (kept in scripts/assets
// alongside the InDesign cover PDF, NOT in dist/ which is build output + gitignored).
const SUN_SRC = join(ROOT, "scripts", "assets", "cover-artwork.png");

const TARGET_W = 1600;
const RENDER_DPI = 320;
const CREAM = "#F5EFE0";
// The watercolor sun source (cover-artwork.png) is paler/washed compared to the
// vivid sun baked into the InDesign book cover (cover.jpg, core ≈ srgb(245,151,29)).
// Deepen saturation (and trim brightness a touch so red doesn't blow to 255) so the
// audiobook/print covers don't look faded next to the book. The cream background is
// re-keyed to CREAM after this, so only the orange is affected.
const SUN_BRIGHTNESS = 96;
const SUN_SATURATION = 135;

const TEX_BIN_DIR = "/Library/TeX/texbin";
const XELATEX_BIN = join(TEX_BIN_DIR, "xelatex");
const TEX_ENV = { ...process.env, PATH: `${TEX_BIN_DIR}:${process.env.PATH ?? ""}` };

function findXelatex(): string {
  return existsSync(XELATEX_BIN) ? XELATEX_BIN : "xelatex";
}

// Desaturate + cream-flatten the watercolor sun so it matches the corrected
// cover tone and shows no rectangle against \pagecolor{cream}.
function prepareSun(): string {
  const dst = join(OUT_DIR, "sun-amber.png");
  execFileSync(
    "magick",
    [
      SUN_SRC,
      "-modulate", `${SUN_BRIGHTNESS},${SUN_SATURATION},100`,
      // the artwork bg is ~#FBF7EE (near-white cream); key it to the exact page
      // cream so no lighter square shows through.
      "-fuzz", "6%", "-fill", CREAM, "-opaque", "#FBF7EE",
      "-background", CREAM, "-flatten", "-strip",
      dst,
    ],
    { stdio: "inherit" }
  );
  return dst;
}

type Target = {
  jobname: string;
  /** Output raster width in px (default 1600). ACX cover needs ≥2400. */
  widthPx?: number;
  tokens: Record<string, string>;
  outputs: { file: string; grayscale: boolean; publishAs?: string }[];
};

// Print trim: 5×8 + 0.125in bleed = 5.25×8.25, ratio 0.636 — matches
// back-cover-print so the wraparound's front/back panels fill identically.
const TARGETS: Target[] = [
  {
    jobname: "front-cover-print",
    tokens: {
      FONTSIZE: "11pt",
      PAPER_W: "5.25in", PAPER_H: "8.25in",
      M_TOP: "0.5in", M_BOT: "0.5in", M_LEFT: "0.85in", M_RIGHT: "0.55in",
      STRIPE_W: "0.625in", STITCH_X: "0.555in",
      TITLE_TOP: "0.7in", TITLE_PT: "39",
      SUBTITLE_GAP: "0.26in", SUBTITLE_PT: "13",
      SUN_GAP: "0.45in", SUN_W: "2.5in",
      EYEBROW_PT: "12", EYEBROW_GAP: "0.05in", GROUP_GAP: "0.16in",
      AUTHOR_PT: "17", URL_GAP: "0.18in", URL_PT: "12", BOTTOM: "0.6in",
    },
    outputs: [
      { file: "front-cover-print-color.jpg", grayscale: false },
      { file: "front-cover-print-bw.jpg", grayscale: true },
    ],
  },
  // Square audiobook cover for ACX / Audible (min 2400×2400; we emit 3000²).
  // No bleed — it's a standalone thumbnail — so margins are symmetric and the
  // gold stripe is dropped (it would read as a stray book-spine on a square).
  {
    jobname: "audiobook-cover",
    widthPx: 3000,
    tokens: {
      FONTSIZE: "12pt",
      PAPER_W: "8in", PAPER_H: "8in",
      M_TOP: "0.6in", M_BOT: "0.6in", M_LEFT: "0.7in", M_RIGHT: "0.7in",
      STRIPE_W: "0in", STITCH_X: "-1in", // stripe off-canvas (hidden)
      TITLE_TOP: "0.2in", TITLE_PT: "46",
      SUBTITLE_GAP: "0.3in", SUBTITLE_PT: "17",
      SUN_GAP: "0.4in", SUN_W: "3.0in",
      EYEBROW_PT: "15", EYEBROW_GAP: "0.06in", GROUP_GAP: "0.22in",
      AUTHOR_PT: "22", URL_GAP: "0.18in", URL_PT: "15", BOTTOM: "0.4in",
    },
    outputs: [{ file: "audiobook-cover.jpg", grayscale: false }],
  },
];

function buildTarget(target: Target, sunImg: string): void {
  let tex = readFileSync(TEMPLATE, "utf8")
    .replace(/__FONTS_DIR__/g, FONTS_DIR)
    .replace(/__SUN_IMG__/g, sunImg);
  for (const [token, value] of Object.entries(target.tokens)) {
    tex = tex.replace(new RegExp(`__${token}__`, "g"), value);
  }
  const texPath = join(OUT_DIR, `${target.jobname}.tex`);
  writeFileSync(texPath, tex);

  const args = [
    "-interaction=nonstopmode",
    "-halt-on-error",
    `-output-directory=${OUT_DIR}`,
    texPath,
  ];
  execFileSync(findXelatex(), args, { stdio: "inherit", env: TEX_ENV });
  execFileSync(findXelatex(), args, { stdio: "inherit", env: TEX_ENV });

  const pdf = join(OUT_DIR, `${target.jobname}.pdf`);
  if (!existsSync(pdf)) {
    console.error(`ERROR: xelatex did not produce ${pdf}`);
    process.exit(1);
  }

  const tmpPng = join(OUT_DIR, `${target.jobname}-render.png`);
  execFileSync(
    "pdftoppm",
    ["-png", "-r", String(RENDER_DPI), "-singlefile", pdf, tmpPng.replace(/\.png$/, "")],
    { stdio: "inherit" }
  );

  const widthPx = target.widthPx ?? TARGET_W;
  for (const out of target.outputs) {
    const dest = join(OUT_DIR, out.file);
    execFileSync(
      "magick",
      [
        tmpPng,
        "-resize", `${widthPx}x`,
        "-colorspace", out.grayscale ? "Gray" : "sRGB",
        "-background", "white", "-flatten", "-strip",
        "-quality", "92",
        dest,
      ],
      { stdio: "inherit" }
    );
    console.log(`[generate-front-cover] wrote ${dest}`);
    if (out.publishAs) publishToDownloads(dest, out.publishAs);
  }

  rmSync(tmpPng, { force: true });
  for (const ext of ["aux", "log", "out"]) {
    rmSync(join(OUT_DIR, `${target.jobname}.${ext}`), { force: true });
  }
}

function main(): void {
  if (!existsSync(TEMPLATE)) {
    console.error(`ERROR: missing template at ${TEMPLATE}`);
    process.exit(1);
  }
  if (!existsSync(SUN_SRC)) {
    console.error(`ERROR: missing sun art at ${SUN_SRC}`);
    process.exit(1);
  }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const sunImg = prepareSun();
  for (const target of TARGETS) buildTarget(target, sunImg);
}

main();
