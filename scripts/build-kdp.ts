/**
 * Build the Plain Dharma KDP paperback package (5×8 trim).
 *
 * For each interior variant produces TWO upload-ready files in dist/kdp/:
 *   plain-dharma-kdp-interior-{bw,color}.pdf — the book block, COVER-FREE
 *       (KDP wants covers off the interior), 5×8 + 0.125in bleed, twoside.
 *   plain-dharma-kdp-cover-{bw,color}.pdf — the wraparound cover (back | spine |
 *       front), spine width computed from THIS interior's page count × the
 *       paper's caliper. Always full color (KDP prints covers in color
 *       regardless of the interior); only the spine width differs per variant.
 *
 * Pipeline per variant:
 *   1. Assemble the shared book markdown + per-variant illustrations
 *   2. pandoc → xelatex → cover-free interior PDF
 *   3. pdfinfo → page count → spine width
 *   4. render kdp-wrap-cover.tex with that spine → xelatex (×2) → cover PDF
 *
 * Cover art is the GENERATED 5×8 print pair (front-cover-print-color.jpg from
 * render-covers.ts, back-cover-print-color.jpg from render-covers.ts
 * — the latter carries the paperback ISBN barcode). The 6×9 designer cover.jpg
 * is NOT used here (wrong ratio for 5×8). Run those two generators first.
 *
 * LARGE PRINT (`--large-print`, pnpm build-kdp-large): a separate edition at
 * 6×9 trim with 16pt body type — KDP's floor for calling a book "Large Print".
 * One B&W-on-cream interior + its wraparound, written as
 * plain-dharma-kdp-large-{interior,cover}.pdf. Same pipeline; the EDITION
 * table holds everything that differs.
 *
 * Run: pnpm build-kdp | pnpm build-kdp-large
 */

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  BOOK_SUBTITLE,
  BOOK_TITLE,
  SITE_URL,
  TITLE_PAGE_AUTHOR_TEX,
  buildBookMarkdown,
  generateQrCode,
} from "./lib/book-source.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ILLUSTRATIONS_DIR = join(ROOT, "public", "illustrations");
const FONTS_DIR = join(ROOT, "src", "app", "fonts");
const TEMPLATE_DIR = join(ROOT, "scripts", "templates");
const EBOOK_DIR = join(ROOT, "dist", "ebook");
const OUT_DIR = join(ROOT, "dist", "kdp");

// 5×8 generated print covers (ratio 0.636 = 5.25×8.25). The back one carries the
// paperback's own EAN-13 (ISBN 978-1-891328-39-8). Always color — KDP prints
// covers in color even for the B&W interior.
const FRONT_COVER = join(EBOOK_DIR, "front-cover-print-color.jpg");
const BACK_COVER = join(EBOOK_DIR, "back-cover-print-color.jpg");
// The bw edition prints on groundwood, so its back cover carries the paper note.
// Same art otherwise — still color, per the note above.
const BACK_COVER_GROUNDWOOD = join(EBOOK_DIR, "back-cover-print-groundwood.jpg");
// 6×9 large-print pair (6.25×9.25 with bleed), also from render-covers.ts.
const FRONT_COVER_LP = join(EBOOK_DIR, "front-cover-6x9-lp-color.jpg");
const BACK_COVER_LP = join(EBOOK_DIR, "back-cover-6x9-lp-color.jpg");

const ILLUSTRATION_TARGET_WIDTH = 1200; // 300 PPI at ~4in displayed width
const ILLUSTRATION_JPEG_QUALITY = 88;

const TEX_BIN_DIR = "/Library/TeX/texbin";
const XELATEX_BIN = join(TEX_BIN_DIR, "xelatex");
const TEX_ENV = { ...process.env, PATH: `${TEX_BIN_DIR}:${process.env.PATH ?? ""}` };

// KDP per-page thickness (inches), from KDP's spine-width spec. Spine = pages ×
// caliper. Color interiors print on white paper; B&W here uses groundwood.
const CALIPER = {
  white: 0.002252, // standard color & B&W on white
  cream: 0.0025, // B&W on cream
  // B&W on groundwood — the cheaper, ~15%-lower-CO2 stock. Confirmed against
  // KDP's cover calculator: 5×8, B&W, groundwood, 48pp → spine 0.113",
  // full cover 10.363×8.25. Groundwood is B&W-only and excludes heavy-ink
  // interiors, so it applies to the bw variant only — never the color one,
  // whose cream \pagecolor floods every page.
  groundwood: 0.002347,
} as const;

type Variant = "bw" | "color";
type VariantCfg = {
  slug: string;
  pagecolorSetup: string;
  illustrationBg: string;
  grayscale: boolean;
  caliper: number;
  /** Back-cover art for this edition's wraparound (differs by paper note). */
  backCover: string;
};

const VARIANTS: Record<Variant, VariantCfg> = {
  bw: {
    slug: "bw",
    pagecolorSetup: "% B&W variant: white pages (no \\pagecolor)",
    illustrationBg: "white",
    grayscale: true,
    // Cream paper — pick "Black & white interior with cream paper" in KDP's
    // Print Options to match (owner's choice, 6 Sep 2026; it is also what the
    // first paperback used — Amazon lists …-38-1 as 5 x 0.12 x 8 in, and only
    // cream's caliper yields a 0.12" spine at 48pp). Switch to CALIPER.groundwood
    // + BACK_COVER_GROUNDWOOD for the cheaper stock; the spine and both panel
    // offsets follow the caliper, and the groundwood back cover carries a paper
    // note that is false on any other stock.
    caliper: CALIPER.cream,
    backCover: BACK_COVER,
  },
  color: {
    slug: "color",
    pagecolorSetup: "\\pagecolor{cream}",
    illustrationBg: "#F5EFE0",
    grayscale: false,
    caliper: CALIPER.white,
    backCover: BACK_COVER,
  },
};

/**
 * Everything that differs between the standard and large-print paperbacks.
 * Trim and margins are inches; the PDF page is trim + 0.125in bleed per edge.
 * The head and foot clearances are explained in buildInterior.
 */
type Edition = {
  key: "standard" | "large";
  trimW: number;
  trimH: number;
  /** dist/kdp/ names: `${prefix}-interior….pdf`, `${prefix}-cover….pdf`. */
  outPrefix: string;
  variants: Variant[];
  inner: number;
  outer: number;
  top: number;
  bottom: number;
  footskip: number;
  headsep: string;
  headheight: string;
  /** LaTeX appended to the shared preamble, or null for none. */
  extraPreamble: string | null;
  frontCover: string;
  /** Overrides the variant's back cover (the large print has its own art). */
  backCover: string | null;
};

const STANDARD: Edition = {
  key: "standard",
  trimW: 5,
  trimH: 8,
  outPrefix: "plain-dharma-kdp",
  variants: ["bw", "color"],
  inner: 0.875,
  outer: 0.625,
  top: 0.85,
  bottom: 0.85,
  footskip: 0.35,
  headsep: "8pt",
  headheight: "14pt",
  extraPreamble: null,
  frontCover: FRONT_COVER,
  backCover: null,
};

/**
 * 16pt body via scrextend, which recomputes every size command (\footnotesize,
 * \Large…) from the new base — the book class itself stops at 12pt. The shared
 * preamble sizes its heads and folios relative to \normalsize, so they scale
 * with it; the head box grows to fit, and `top` grows to keep it in the safe
 * zone (top − headsep − headheight ≈ 0.6in from the PDF edge).
 */
const LARGE_PRINT_PREAMBLE = String.raw`
% Large print: 16pt body (KDP's minimum for the "Large Print" label).
\usepackage[fontsize=16pt]{scrextend}
\setlength{\headheight}{18pt}
\setlength{\headsep}{10pt}
% ~50 characters a line at 16pt on the 6x9 measure; a little more stretch
% keeps the rare stubborn line out of the margin.
\setlength{\emergencystretch}{3em}
% \LARGE on a 16pt base is ~25pt; one step down keeps chapter titles to two
% lines at most.
\titleformat{\chapter}[display]
  {\normalfont\Large\bfseries\color{ink}\raggedright\hyphenpenalty=10000}
  {}{0pt}{\Large}
\titleformat{\section}
  {\normalfont\large\bfseries\color{ink}\raggedright\hyphenpenalty=10000}
  {}{0pt}{}
% 70% of the wider measure would let the illustrations dominate the page.
\setkeys{Gin}{width=0.6\linewidth,keepaspectratio}
`;

const LARGE: Edition = {
  key: "large",
  trimW: 6,
  trimH: 9,
  outPrefix: "plain-dharma-kdp-large",
  // B&W on cream only: large-print readers want contrast, not color plates.
  variants: ["bw"],
  inner: 0.95,
  outer: 0.7,
  top: 0.95,
  bottom: 0.9,
  footskip: 0.4,
  headsep: "10pt",
  headheight: "18pt",
  extraPreamble: LARGE_PRINT_PREAMBLE,
  frontCover: FRONT_COVER_LP,
  backCover: BACK_COVER_LP,
};

const EDITION: Edition = process.argv.includes("--large-print") ? LARGE : STANDARD;

function findXelatex(): string {
  return existsSync(XELATEX_BIN) ? XELATEX_BIN : "xelatex";
}

// Per-variant illustration cache (same approach as build-print-pdf).
function prepareIllustration(
  variant: Variant,
  imagesDir: string,
  slug: string
): string | null {
  const cfg = VARIANTS[variant];
  const src = join(ILLUSTRATIONS_DIR, `${slug}.png`);
  if (!existsSync(src)) return null;

  const dst = join(imagesDir, `${slug}.jpg`);
  const srcMtime = statSync(src).mtimeMs;
  const dstMtime = existsSync(dst) ? statSync(dst).mtimeMs : 0;
  if (dstMtime > srcMtime) return dst;

  const args = [
    src,
    "-resize", `${ILLUSTRATION_TARGET_WIDTH}x`,
    "-background", cfg.illustrationBg,
    "-flatten",
  ];
  if (cfg.grayscale) args.push("-colorspace", "Gray");
  args.push(
    "-quality", String(ILLUSTRATION_JPEG_QUALITY),
    "-strip",
    "-interlace", "Plane",
    dst
  );
  execFileSync("magick", args, { stdio: "inherit" });
  return dst;
}

function renderPreamble(variant: Variant, variantDir: string): string {
  const cfg = VARIANTS[variant];
  const tpl = readFileSync(join(TEMPLATE_DIR, "pdf-preamble-print.tex"), "utf8");
  let rendered = tpl
    .replace(/__FONTS_DIR__/g, FONTS_DIR)
    .replace(/__PAGECOLOR_SETUP__/g, cfg.pagecolorSetup);
  if (EDITION.extraPreamble) rendered += EDITION.extraPreamble;
  const out = join(variantDir, "preamble.tex");
  writeFileSync(out, rendered);
  return out;
}

// Cover-free 5×8 interior. Page = 5.25×8.25 (trim + 0.125in bleed all sides,
// matching build-print-pdf; KDP accepts this — the inner over-bleed is absorbed
// by the binding). Twoside, openright. 12pt — test prints read best at 12pt.
function buildInterior(
  variant: Variant,
  bookMdPath: string,
  preamblePath: string,
  outPdf: string
): void {
  const args = [
    "--from=markdown",
    "--to=pdf",
    `--pdf-engine=${findXelatex()}`,
    `--include-in-header=${preamblePath}`,
    "--top-level-division=chapter",
    "--toc",
    "--toc-depth=2",
    "-V", "documentclass=book",
    "-V", "classoption=twoside,openany", // no blank pages before chapters
    "-V", "papersize=",
    "-V", `geometry:paperwidth=${EDITION.trimW + 0.25}in`,
    "-V", `geometry:paperheight=${EDITION.trimH + 0.25}in`,
    "-V", `geometry:inner=${EDITION.inner}in`,
    "-V", `geometry:outer=${EDITION.outer}in`,
    // The running head must clear KDP's safe zone too: head box top =
    // top − headsep(8pt) − headheight(14pt) ≈ 0.54in from the PDF edge,
    // i.e. ≥0.375in inside the trim after the 0.125in bleed.
    "-V", `geometry:top=${EDITION.top}in`,
    "-V", `geometry:headsep=${EDITION.headsep}`,
    "-V", `geometry:headheight=${EDITION.headheight}`,
    // Bottom margin + footskip keep the page number clear of KDP's 0.25in
    // safe zone. With 0.125in bleed, the footer baseline lands at
    // bottom − footskip = 0.5in from the PDF edge = 0.375in from the trim —
    // comfortably inside. (At 0.75/default-footskip it fell to ~0.2in and KDP
    // flagged the chapter-opener page numbers.)
    "-V", `geometry:bottom=${EDITION.bottom}in`,
    "-V", `geometry:footskip=${EDITION.footskip}in`,
    "-V", `title=${BOOK_TITLE}`,
    "-V", `subtitle=${BOOK_SUBTITLE}`,
    "-V", `author=${TITLE_PAGE_AUTHOR_TEX}`,
    "-V", "lang=en",
    "-V", "fontsize=12pt",
    `--output=${outPdf}`,
    bookMdPath,
  ];
  execFileSync("pandoc", args, { stdio: "inherit", env: TEX_ENV });
  console.log(`[build-kdp:${variant}] wrote interior ${outPdf}`);
}

function pageCount(pdf: string): number {
  const out = execFileSync("pdfinfo", [pdf], { encoding: "utf8" });
  const m = out.match(/^Pages:\s+(\d+)/m);
  if (!m) throw new Error(`could not read page count from ${pdf}`);
  return parseInt(m[1], 10);
}

// Wraparound cover sized to this interior's spine. width = bleed + trimW + spine
// + trimW + bleed; height = trimH + 2×bleed. Compiled twice for current-page.
function buildWrapCover(
  variant: Variant,
  pages: number,
  variantDir: string,
  outPdf: string
): void {
  const cfg = VARIANTS[variant];
  const spineIn = pages * cfg.caliper;
  const { trimW, trimH } = EDITION;
  const paperW = 0.125 + trimW + spineIn + trimW + 0.125;
  const paperH = trimH + 0.25;
  const fmt = (n: number) => `${n.toFixed(4)}in`;
  console.log(
    `[build-kdp:${variant}] ${pages} pages → spine ${spineIn.toFixed(4)}in; ` +
      `wrap ${fmt(paperW)} × ${fmt(paperH)}`
  );

  const tpl = readFileSync(join(TEMPLATE_DIR, "kdp-wrap-cover.tex"), "utf8");
  const rendered = tpl
    .replace(/__PAPER_W__/g, fmt(paperW))
    .replace(/__PAPER_H__/g, fmt(paperH))
    .replace(/__TRIM_W__/g, `${trimW}in`)
    .replace(/__TRIM_H__/g, `${trimH}in`)
    .replace(/__SPINE_W__/g, fmt(spineIn))
    .replace(/__BACK_IMG__/g, EDITION.backCover ?? cfg.backCover)
    .replace(/__FRONT_IMG__/g, EDITION.frontCover);
  const jobname = `kdp-cover-${EDITION.key}-${cfg.slug}`;
  const texPath = join(variantDir, `${jobname}.tex`);
  writeFileSync(texPath, rendered);

  const xelatexArgs = [
    "-interaction=nonstopmode",
    "-halt-on-error",
    `-output-directory=${variantDir}`,
    texPath,
  ];
  execFileSync(findXelatex(), xelatexArgs, { stdio: "inherit", env: TEX_ENV });
  execFileSync(findXelatex(), xelatexArgs, { stdio: "inherit", env: TEX_ENV });

  const built = join(variantDir, `${jobname}.pdf`);
  if (!existsSync(built)) throw new Error(`xelatex did not produce ${built}`);
  // Move the finished cover up to dist/kdp/ with its public name.
  execFileSync("cp", [built, outPdf]);
  console.log(`[build-kdp:${variant}] wrote cover ${outPdf}`);
}

function buildVariant(variant: Variant): void {
  const cfg = VARIANTS[variant];
  const variantDir = join(
    OUT_DIR,
    EDITION.key === "standard" ? cfg.slug : `${EDITION.key}-${cfg.slug}`,
  );
  const imagesDir = join(variantDir, "images");
  if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true });

  const qrPath = generateQrCode(SITE_URL, join(imagesDir, "qr.png"));
  const md = buildBookMarkdown({
    getIllustrationPath: (slug) => prepareIllustration(variant, imagesDir, slug),
    qrCodePath: qrPath,
    printUrls: true,
  });
  const bookMd = join(variantDir, "book.md");
  writeFileSync(bookMd, md);

  const preamble = renderPreamble(variant, variantDir);
  // A single-variant edition needs no suffix to tell its files apart.
  const suffix = EDITION.variants.length > 1 ? `-${cfg.slug}` : "";
  const interiorPdf = join(OUT_DIR, `${EDITION.outPrefix}-interior${suffix}.pdf`);
  buildInterior(variant, bookMd, preamble, interiorPdf);

  const pages = pageCount(interiorPdf);
  const coverPdf = join(OUT_DIR, `${EDITION.outPrefix}-cover${suffix}.pdf`);
  buildWrapCover(variant, pages, variantDir, coverPdf);
}

function main(): void {
  const art =
    EDITION.key === "large"
      ? [FRONT_COVER_LP, BACK_COVER_LP]
      : [FRONT_COVER, BACK_COVER, BACK_COVER_GROUNDWOOD];
  for (const img of art) {
    if (!existsSync(img)) {
      console.error(
        `ERROR: missing cover art ${img}. Run \`pnpm render-covers\` and ` +
          `\`pnpm render-covers\` first.`
      );
      process.exit(1);
    }
  }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  for (const variant of EDITION.variants) {
    buildVariant(variant);
  }
}

main();
