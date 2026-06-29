/**
 * Render the Plain Dharma FRONT cover from book/front-cover.html — the single
 * source of truth — to print-ready rasters via headless Chrome.
 *
 * Why this replaces the old XeLaTeX pipeline (scripts/templates/front-cover.tex):
 * the cover is now an HTML/CSS design you can preview in a browser, so there's
 * one file to edit and what-you-see-is-what-ships. Chrome rasterizes the exact
 * 1600×2400 (6×9) composition at high DPI — the same end product the LaTeX path
 * produced (it rasterized to JPG too), minus the second source of truth.
 *
 * Trim: 6×9 (ratio 0.667 — the trim the cover was DESIGNED at; no reflow).
 * The design is authored at 1600×2400 CSS px = 6×9 @ 266.7 dpi; rendering at a
 * 2× device scale factor yields 3200×4800 px ≈ 533 dpi — well above KDP's 300.
 *
 * Outputs (dist/ebook/):
 *   front-cover-6x9-color.png   — lossless master
 *   front-cover-print-color.jpg — color, consumed by build-kdp's wraparound
 *   front-cover-print-bw.jpg    — grayscale variant
 *
 * NOTE: build-kdp's wraparound + spine math are still wired for 5×8; retargeting
 * the wraparound (and back cover) to 6×9 + bleed is a separate follow-up. This
 * script only owns the front face.
 *
 * Run: pnpm generate-front-cover  (alias: pnpm render-front-cover)
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "dist", "ebook");
const COVER_HTML = join(ROOT, "book", "front-cover.html");

// The .cover element sits at (24,24) inside a 24px dark stage (see the HTML).
// Cropping it off gives a clean trim with no shadow/letterbox.
const STAGE_INSET = 24;
const COVER_W = 1600;
const COVER_H = 2400;
const SCALE = 2; // device pixel ratio → 3200×4800 master (~533 dpi at 6×9)

const CHROME_CANDIDATES = [
  process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
].filter((p): p is string => Boolean(p));

function findChrome(): string {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!found) {
    console.error(
      "ERROR: no headless Chrome found. Set CHROME=/path/to/chrome, or install " +
        "Google Chrome. Tried:\n  " + CHROME_CANDIDATES.join("\n  "),
    );
    process.exit(1);
  }
  return found;
}

function main(): void {
  if (!existsSync(COVER_HTML)) {
    console.error(`ERROR: missing cover at ${COVER_HTML}`);
    process.exit(1);
  }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const chrome = findChrome();
  const rawPng = join(OUT_DIR, "front-cover-raw.png");

  // Screenshot the whole stage at 2×, then crop the .cover out of it.
  execFileSync(
    chrome,
    [
      "--headless",
      "--disable-gpu",
      "--hide-scrollbars",
      `--force-device-scale-factor=${SCALE}`,
      `--window-size=${COVER_W + STAGE_INSET * 2},${COVER_H + STAGE_INSET * 2}`,
      `--screenshot=${rawPng}`,
      `file://${COVER_HTML}`,
    ],
    { stdio: "inherit" },
  );

  if (!existsSync(rawPng)) {
    console.error("ERROR: Chrome did not produce a screenshot");
    process.exit(1);
  }

  const cropGeom =
    `${COVER_W * SCALE}x${COVER_H * SCALE}+${STAGE_INSET * SCALE}+${STAGE_INSET * SCALE}`;
  const masterPng = join(OUT_DIR, "front-cover-6x9-color.png");
  execFileSync("magick", [rawPng, "-crop", cropGeom, "+repage", masterPng], {
    stdio: "inherit",
  });

  // Color + grayscale print JPGs from the master.
  const targets: { file: string; grayscale: boolean }[] = [
    { file: "front-cover-print-color.jpg", grayscale: false },
    { file: "front-cover-print-bw.jpg", grayscale: true },
  ];
  for (const t of targets) {
    const dest = join(OUT_DIR, t.file);
    execFileSync(
      "magick",
      [
        masterPng,
        "-colorspace", t.grayscale ? "Gray" : "sRGB",
        "-background", "white", "-flatten", "-strip",
        "-quality", "92",
        dest,
      ],
      { stdio: "inherit" },
    );
    console.log(`[render-front-cover] wrote ${dest}`);
  }

  rmSync(rawPng, { force: true });
}

main();
