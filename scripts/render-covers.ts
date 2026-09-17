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
import { publishToDownloads } from "./lib/publish.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "dist", "ebook");
const AUDIOBOOK_DIR = join(ROOT, "dist", "audiobook"); // sits with the .m4b
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

/**
 * The site QR used on the print-shop back cover, generated once into
 * book/assets/ so the HTML can reference it relatively (Chrome loads the filled
 * template from BOOK_DIR). Regenerate by deleting the file.
 */
const SITE_QR = "qr-plaindharma.png";
function siteQrFilename(): string {
  return SITE_QR;
}
function ensureSiteQr(): void {
  const out = join(BOOK_DIR, "assets", SITE_QR);
  if (existsSync(out)) return;
  execFileSync(
    "qrencode",
    ["-o", out, "-t", "PNG32", "-s", "12", "-m", "1", "-l", "M", "https://plaindharma.com"],
    { stdio: "inherit" },
  );
  console.log(`[render-covers] generated ${out}`);
}

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

// Paper note for the groundwood edition only. KDP's substantiation is "at least
// 15% lower CO2 emissions compared to standard papers" — quote the number rather
// than a vague "low carbon", which we couldn't back up on the page. Groundwood is
// B&W-interior-only and barred for heavy-ink interiors, so this line must NEVER
// appear on the premium-color edition (white paper) or on the ebook back cover,
// which isn't printed at all. Hence the per-render token instead of static markup.
const ECO_NOTE =
  "<small>Printed on groundwood paper &mdash; at least 15% lower CO₂.</small>";

/**
 * Fill the back-cover template tokens (geometry + ISBN + barcode + entries).
 *
 * `isbn` is nullable: pass null and the whole ISBN/barcode box is omitted. The
 * print-shop edition takes that path — it's a free-distribution booklet, not the
 * Amazon paperback, so stamping it with 978-1-891328-38-1 would make every copy
 * scan as a retail product it isn't.
 */
function fillBackCover(
  html: string,
  isbn: string | null,
  geom: Record<string, string>,
  opts: { eco?: boolean; qr?: boolean } = {},
): string {
  let isbnBlock = "";
  if (isbn) {
    isbnBlock =
      `<div class="isbn">\n      <p class="label">ISBN ${isbn}</p>\n      ` +
      `${ean13Svg(isbn, { moduleWidth: 2.6, barHeight: 100, fontPx: 22 })}\n    </div>`;
  } else if (opts.qr) {
    // Relative path — Chrome loads the filled template from BOOK_DIR.
    isbnBlock =
      `<div class="qrbox">\n      <img src="assets/${siteQrFilename()}" alt="">\n` +
      `      <p class="label">READ &middot; LISTEN &middot; SHARE</p>\n    </div>`;
  }
  let out = html
    .replace(/__ENTRIES__/g, () => backCoverEntries())
    .replace(/__ISBN_BLOCK__/g, () => isbnBlock)
    .replace(/__ECO_NOTE__/g, opts.eco ? ECO_NOTE : "");
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
  /** Output directory; defaults to dist/ebook. */
  dir?: string;
  /** Also copy the written file into public/downloads/ under this name (reader-facing). */
  publishAs?: string;
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

/**
 * Print-shop cover geometry: the A-series trims + 3mm bleed, at 300dpi, each
 * rendered at scale 2 for 600dpi masters to match the 5×8 print pair.
 *
 *   A5 trim  148 × 210 mm  →  + bleed  154 × 216 mm  →  1819 × 2551 px
 *   A6 trim  105 × 148 mm  →  + bleed  111 × 154 mm  →  1311 × 1819 px
 *
 * Derived rather than hard-coded, because these have to agree exactly with the
 * numbers build-printshop-pdf.ts computes for the crop marks — two hand-typed
 * pixel counts is how the art and the cut line drift a millimetre apart.
 *
 * The A-series ratio (0.713) differs from the 5.25×8.25 covers' (0.636), which
 * is why these are separate renders rather than a resize — scaling the 5×8 art
 * into an A5 page would either crop the composition or leave cream side bars.
 * A5 and A6 are near-identical in ratio but NOT interchangeable: A6 is rendered
 * at its own pixel size so the type on the back cover is sized for the page it
 * actually prints on, instead of being shrunk to 71% with everything on it.
 */
const COVER_DPI = 300;
const COVER_BLEED_MM = 3;
const mmToPx = (mm: number) => Math.round((mm * COVER_DPI) / 25.4);
const bleedPx = (trimMm: number) => mmToPx(trimMm + COVER_BLEED_MM * 2);

const A5_BLEED_W = bleedPx(148);
const A5_BLEED_H = bleedPx(210);
const A6_BLEED_W = bleedPx(105);
const A6_BLEED_H = bleedPx(148);

/** Substitute geometry tokens only (front cover has no content tokens). */
function fillGeom(html: string, geom: Record<string, string>): string {
  let out = html;
  for (const [k, v] of Object.entries(geom)) out = out.replace(new RegExp(`__${k}__`, "g"), v);
  return out;
}

const TARGETS: Target[] = [
  {
    html: "front-cover.html",
    cw: 1575,
    ch: 2475,
    scale: 2, // → 3150×4950 ≈ 600dpi at 5.25×8.25
    build: (h) => fillGeom(h, { PAGE_W: "1575", PAGE_H: "2475" }),
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
      { file: "cover.jpg", resizeW: 1600, publishAs: "plain-dharma-cover.jpg" }, // EPUB/PDF cover page + reader download
    ],
  },
  {
    html: "audiobook-cover.html",
    cw: 1500,
    ch: 1500,
    scale: 2, // → 3000×3000 (ACX min 2400²)
    outputs: [{ file: "audiobook-cover.jpg", dir: AUDIOBOOK_DIR }],
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
  // Same print back cover, plus the groundwood paper note — a separate render
  // because the note is text, so it can't be derived from the color art the way
  // the grayscale export is. build-kdp picks this one for the bw/groundwood
  // wraparound. NOTE: paperback covers print in color on both editions, so this
  // has no grayscale sibling.
  {
    html: "back-cover.html",
    cw: 1575,
    ch: 2475,
    scale: 2,
    build: (h) =>
      fillBackCover(
        h,
        PRINT_ISBN,
        {
          PAGE_W: "1575", PAGE_H: "2475", BODY: "38",
          BAND_W: "150", STITCH_R: "132",
          PAD_TOP: "150", PAD_LEFT: "130", PAD_RIGHT: "250", PAD_BOT: "150",
        },
        { eco: true },
      ),
    outputs: [{ file: "back-cover-print-groundwood.jpg" }],
  },
  // ── Print-shop edition (A5 + 3mm bleed) ──────────────────────────────────
  // Fed to build-printshop-pdf.ts, which lays each one on an A4 sheet with crop
  // marks. Color only: the shop runs the two cover sheets on card in color and
  // the interior in B&W, so a grayscale sibling would never be used.
  {
    html: "front-cover.html",
    cw: A5_BLEED_W,
    ch: A5_BLEED_H,
    scale: 2,
    build: (h) => fillGeom(h, { PAGE_W: String(A5_BLEED_W), PAGE_H: String(A5_BLEED_H) }),
    outputs: [{ file: "front-cover-a5-color.jpg" }],
  },
  {
    html: "back-cover.html",
    cw: A5_BLEED_W,
    ch: A5_BLEED_H,
    scale: 2,
    // No ISBN — see fillBackCover. Geometry scaled from the 5×8 back cover:
    // the page is 15% wider but only 3% taller, so the horizontal pads grow
    // and the body size ticks up to keep the measure from going slack.
    build: (h) =>
      fillBackCover(
        h,
        null,
        {
          PAGE_W: String(A5_BLEED_W), PAGE_H: String(A5_BLEED_H), BODY: "40",
          BAND_W: "173", STITCH_R: "152",
          PAD_TOP: "165", PAD_LEFT: "150", PAD_RIGHT: "290", PAD_BOT: "165",
        },
        { qr: true },
      ),
    outputs: [{ file: "back-cover-a5-color.jpg" }],
  },
  // ── Print-shop edition, pocket size (A6 + 3mm bleed) ─────────────────────
  // Same artwork, re-rendered at A6's own pixel size rather than resized down
  // from A5: a resize would shrink the back-cover type along with the page and
  // land the six teasers around 7pt on a 105mm-wide card. The pads below scale
  // with the trim, but BODY is held up so the entries stay legible at the size
  // they actually print — this face carries more text per mm than any other.
  {
    html: "front-cover.html",
    cw: A6_BLEED_W,
    ch: A6_BLEED_H,
    scale: 2,
    build: (h) => fillGeom(h, { PAGE_W: String(A6_BLEED_W), PAGE_H: String(A6_BLEED_H) }),
    outputs: [{ file: "front-cover-a6-color.jpg" }],
  },
  {
    html: "back-cover.html",
    cw: A6_BLEED_W,
    ch: A6_BLEED_H,
    scale: 2,
    // No ISBN — see fillBackCover. Free-distribution booklet, same as A5.
    build: (h) =>
      fillBackCover(
        h,
        null,
        {
          PAGE_W: String(A6_BLEED_W), PAGE_H: String(A6_BLEED_H), BODY: "33",
          BAND_W: "125", STITCH_R: "110",
          PAD_TOP: "112", PAD_LEFT: "104", PAD_RIGHT: "200", PAD_BOT: "112",
        },
        { qr: true },
      ),
    outputs: [{ file: "back-cover-a6-color.jpg" }],
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
    outputs: [{ file: "back-cover.jpg", resizeW: 1600, publishAs: "plain-dharma-back-cover.jpg" }],
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
  const outDir = out.dir ?? OUT_DIR;
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const dest = join(outDir, out.file);
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
  if (out.publishAs) publishToDownloads(dest, out.publishAs);
}

function main(): void {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const chrome = findChrome();
  ensureSiteQr();
  for (const t of TARGETS) {
    const master = renderMaster(chrome, t);
    for (const out of t.outputs) writeOutput(master, out);
    rmSync(master, { force: true });
  }
}

main();
