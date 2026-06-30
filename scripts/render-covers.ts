/**
 * Render ALL Plain Dharma cover faces from the HTML sources in book/ — the
 * single source of truth — to print/ebook-ready rasters via headless Chrome.
 *
 * This replaces the old XeLaTeX/InDesign cover scripts (generate-front-cover.ts,
 * generate-cover.ts) so every surface shares one design ("Version A"):
 *
 *   book/front-cover.html      5.25×8.25 (5×8 + bleed) → front-cover-print-{color,bw}.jpg
 *                              (drops into build-kdp's wraparound)
 *   book/front-cover-6x9.html  6×9 → cover.jpg (EPUB interior + PDF cover page)
 *                              and, cream-padded to 1.6:1, cover-kindle.jpg
 *   book/audiobook-cover.html  1:1 → audiobook-cover.jpg (ACX/Audible, 3000²)
 *
 * Each face is authored in CSS px and screenshotted at a 2× device scale factor
 * for ≥300dpi. The .cover element sits at (24,24) in a dark stage; we crop it.
 *
 * Run: pnpm render-covers   (needs Google Chrome + ImageMagick `magick`)
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { DEFAULT_LOCALE, getSuttasInOrder } from "@plain-dharma/content";

import { ean13Svg } from "./lib/ean13.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "dist", "ebook");
const BOOK_DIR = join(ROOT, "book");
const STAGE_INSET = 24; // the .cover offset inside the dark stage (see the HTML)

// Back-cover ISBNs (per-edition Bowker records — see docs/publishing).
const EBOOK_ISBN = "978-1-891328-37-4";
const PRINT_ISBN = "978-1-891328-38-1";
// Hardcoded English titles, paired in order with the registry teasers.
const BACK_COVER_TITLES = [
  "The Buddha's First Talk",
  "The Buddha's Second Talk",
  "The Fire Sermon",
  "On Loving-Kindness",
  "The Foundations of Mindfulness",
  "How to Decide What to Believe",
];

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The six numbered entries (bold title + italic teaser) as HTML. */
function backCoverEntries(): string {
  const teasers = getSuttasInOrder(DEFAULT_LOCALE).map((m) => m.teaser);
  if (teasers.length !== BACK_COVER_TITLES.length) {
    console.error(`ERROR: ${BACK_COVER_TITLES.length} titles but ${teasers.length} teasers`);
    process.exit(1);
  }
  return BACK_COVER_TITLES.map(
    (title, i) =>
      `<div class="entry"><span class="t">${i + 1}.&nbsp;&nbsp;${escapeHtml(title)}</span>` +
      `<div class="d">${escapeHtml(teasers[i])}</div></div>`,
  ).join("\n    ");
}

/** Fill the back-cover template tokens (geometry + ISBN + barcode + entries). */
function fillBackCover(html: string, isbn: string, geom: Record<string, string>): string {
  const barcode = ean13Svg(isbn, { moduleWidth: 2.6, barHeight: 100, fontPx: 22 });
  let out = html
    .replace(/__ENTRIES__/g, backCoverEntries())
    .replace(/__BARCODE__/g, barcode)
    .replace(/__ISBN__/g, isbn);
  for (const [k, v] of Object.entries(geom)) out = out.replace(new RegExp(`__${k}__`, "g"), v);
  return out;
}

const CHROME_CANDIDATES = [
  process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
].filter((p): p is string => Boolean(p));

type Output = {
  file: string;
  grayscale?: boolean;
  /** Resize the master to this width (px) before writing; omit to keep full res. */
  resizeW?: number;
  /** Shave this many px off every edge of the master first (e.g. to drop bleed). */
  shave?: number;
};

type Target = {
  html: string;
  cw: number;
  ch: number;
  scale: number;
  outputs: Output[];
  /** If set, `html` is a template: this fills its __TOKENS__ before rendering. */
  build?: (templateHtml: string) => string;
};

const TARGETS: Target[] = [
  {
    html: "front-cover.html",
    cw: 1575,
    ch: 2475,
    scale: 2, // → 3150×4950 ≈ 600dpi at 5.25×8.25
    outputs: [
      { file: "front-cover-print-color.jpg" },
      { file: "front-cover-print-bw.jpg", grayscale: true },
      // Kindle = the print front at TRIM (5×8 trim ratio == Kindle 1.6:1), so
      // shave the 0.125" bleed (37.5px × scale 2 = 75px) off each edge →
      // 3000×4800, then resize to 1600×2560. The true digital twin of the
      // paperback front: full-height band, no padding seams.
      { file: "cover-kindle.jpg", shave: 75, resizeW: 1600 },
    ],
  },
  {
    html: "front-cover-6x9.html",
    cw: 1600,
    ch: 2400,
    scale: 2, // → 3200×4800 master
    outputs: [
      { file: "cover.jpg", resizeW: 1600 }, // EPUB interior + PDF cover page
    ],
  },
  {
    html: "audiobook-cover.html",
    cw: 1500,
    ch: 1500,
    scale: 2, // → 3000×3000 (ACX min 2400²)
    outputs: [{ file: "audiobook-cover.jpg" }],
  },
  // Back cover — print trim (5.25×8.25 + bleed), feeds build-kdp's wraparound.
  {
    html: "back-cover.html",
    cw: 1575,
    ch: 2475,
    scale: 2,
    build: (h) =>
      fillBackCover(h, PRINT_ISBN, {
        PAGE_W: "1575", PAGE_H: "2475", BODY: "38",
        BAND_W: "150", STITCH_R: "132",
        PAD_TOP: "150", PAD_LEFT: "130", PAD_RIGHT: "250", PAD_BOT: "150",
      }),
    outputs: [
      { file: "back-cover-print-color.jpg" },
      { file: "back-cover-print-bw.jpg", grayscale: true },
    ],
  },
  // Back cover — ebook trim (6×9), a downloadable companion to cover.jpg.
  {
    html: "back-cover.html",
    cw: 1600,
    ch: 2400,
    scale: 2,
    build: (h) =>
      fillBackCover(h, EBOOK_ISBN, {
        PAGE_W: "1600", PAGE_H: "2400", BODY: "40",
        BAND_W: "130", STITCH_R: "112",
        PAD_TOP: "160", PAD_LEFT: "150", PAD_RIGHT: "240", PAD_BOT: "160",
      }),
    outputs: [{ file: "back-cover.jpg", resizeW: 1600 }],
  },
];

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

function renderMaster(chrome: string, t: Target): string {
  const templatePath = join(BOOK_DIR, t.html);
  if (!existsSync(templatePath)) {
    console.error(`ERROR: missing cover at ${templatePath}`);
    process.exit(1);
  }
  // Unique per-target key (two targets can share one template file).
  const key = t.outputs[0].file.replace(/\.[^.]+$/, "");

  // Templated targets: fill __TOKENS__ into a temp HTML next to the fonts/assets.
  let htmlPath = templatePath;
  let tmpHtml: string | null = null;
  if (t.build) {
    tmpHtml = join(BOOK_DIR, `_tmp-${key}.html`);
    writeFileSync(tmpHtml, t.build(readFileSync(templatePath, "utf8")));
    htmlPath = tmpHtml;
  }

  const rawPng = join(OUT_DIR, `_raw-${key}.png`);
  execFileSync(
    chrome,
    [
      "--headless",
      "--disable-gpu",
      "--hide-scrollbars",
      `--force-device-scale-factor=${t.scale}`,
      `--window-size=${t.cw + STAGE_INSET * 2},${t.ch + STAGE_INSET * 2}`,
      `--screenshot=${rawPng}`,
      `file://${htmlPath}`,
    ],
    { stdio: ["ignore", "ignore", "ignore"] },
  );
  if (tmpHtml) rmSync(tmpHtml, { force: true });
  if (!existsSync(rawPng)) {
    console.error(`ERROR: Chrome did not produce a screenshot for ${t.html}`);
    process.exit(1);
  }
  const masterPng = join(OUT_DIR, `_master-${key}.png`);
  const crop =
    `${t.cw * t.scale}x${t.ch * t.scale}+${STAGE_INSET * t.scale}+${STAGE_INSET * t.scale}`;
  execFileSync("magick", [rawPng, "-crop", crop, "+repage", masterPng], {
    stdio: "inherit",
  });
  rmSync(rawPng, { force: true });
  return masterPng;
}

function writeOutput(master: string, out: Output): void {
  const dest = join(OUT_DIR, out.file);
  const args: string[] = [master];
  if (out.shave) args.push("-shave", `${out.shave}x${out.shave}`, "+repage");
  if (out.resizeW) args.push("-resize", `${out.resizeW}x`);
  args.push(
    "-colorspace", out.grayscale ? "Gray" : "sRGB",
    "-background", "white", "-flatten", "-strip",
    "-quality", "92",
    dest,
  );
  execFileSync("magick", args, { stdio: "inherit" });
  console.log(`[render-covers] wrote ${dest}`);
}

function main(): void {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const chrome = findChrome();
  for (const t of TARGETS) {
    const master = renderMaster(chrome, t);
    for (const out of t.outputs) writeOutput(master, out);
    rmSync(master, { force: true });
  }
}

main();
