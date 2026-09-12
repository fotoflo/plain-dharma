/**
 * Build the Plain Dharma PRINT-SHOP edition — the files you hand a copy shop.
 *
 * Produces TWO files in dist/printshop/ (and publishes both to public/downloads):
 *   plain-dharma-printshop-a5.pdf         — the interior, B&W, A5, 12pt
 *   plain-dharma-printshop-a5-covers.pdf  — 2 pages, color, A4 with crop marks
 *
 * Why two files: the shop runs the covers on card in a color pass and the
 * interior in a B&W pass. Handed one mixed PDF they will either print the whole
 * thing in color (expensive) or miss the cover pages entirely.
 *
 * Why A5: it's the A-series twin of the 5×8 edition — same height, 15mm wider —
 * and two A5 pages tile an A4 sheet exactly, which is how the shop prints it
 * (2-up, duplex, cut down the middle, bind). The 5.25×8.25 print PDF isn't an
 * A-size, so a shop can only centre it on A4 and waste the margins, or scale it
 * and guess. That's what made the first attempt come out small.
 *
 * The pages are deliberately NOT imposed. Every shop's driver does 2-up itself
 * and controls the duplex flip; pre-imposing would hard-code one binding method
 * and one flip direction into the file, and break silently if either differs.
 *
 * Printing instructions live at /print on the site, not in the PDF — so the
 * book is just the book, and the spec can be corrected without a rebuild.
 *
 * Run: pnpm build-printshop-pdf   (needs pandoc, xelatex, ImageMagick)
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
import { publishToDownloads } from "./lib/publish.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ILLUSTRATIONS_DIR = join(ROOT, "public", "illustrations");
const FONTS_DIR = join(ROOT, "src", "app", "fonts");
const TEMPLATE_DIR = join(ROOT, "scripts", "templates");
const EBOOK_DIR = join(ROOT, "dist", "ebook");
const OUT_DIR = join(ROOT, "dist", "printshop");
const WORK_DIR = join(OUT_DIR, "work");

const INTERIOR_NAME = "plain-dharma-printshop-a5.pdf";
const COVERS_NAME = "plain-dharma-printshop-a5-covers.pdf";

// The /print page needs the page count and sheet count to tell the shop what
// they're printing, but public/downloads/ is gitignored — the built PDFs aren't
// there in CI. So the build writes the numbers into this committed JSON, the
// same way the audio manifests stay in git while the mp3s live on the CDN.
const SPEC_FILE = join(ROOT, "src", "content", "printshop-spec.json");

// A5 cover art at 3mm bleed, rendered by render-covers.ts.
const FRONT_COVER = join(EBOOK_DIR, "front-cover-a5-color.jpg");
const BACK_COVER = join(EBOOK_DIR, "back-cover-a5-color.jpg");

// 300dpi at the ~75mm displayed width would be 886px; 1200 leaves headroom for
// a shop that prints at 400dpi without bloating the file.
const ILLUSTRATION_TARGET_WIDTH = 1200;

// Displayed illustration width, as a fraction of the 114mm measure.
const ILLUSTRATION_WIDTH_FRAC = 0.66;

// 2-up duplex puts four A5 pages on one A4 sheet, so the interior has to be a
// multiple of 4 or the shop is left with a half-used final sheet.
const PAGES_PER_SHEET = 4;

// A5 trim, in mm — quoted to the shop on /print.
const TRIM_W_MM = 148;
const TRIM_H_MM = 210;

// The A5 measure is narrow enough that the subtitle wraps to "...in Modern /
// English", stranding one word. Break it where the covers break it instead —
// that pairing is fixed, so the title page and the cover now agree.
const SUBTITLE_TEX = BOOK_SUBTITLE.replace(" in Modern English", "\\\\in Modern English");

const TEX_BIN_DIR = "/Library/TeX/texbin";
const XELATEX_BIN = join(TEX_BIN_DIR, "xelatex");
const TEX_ENV = { ...process.env, PATH: `${TEX_BIN_DIR}:${process.env.PATH ?? ""}` };

function findXelatex(): string {
  return existsSync(XELATEX_BIN) ? XELATEX_BIN : "xelatex";
}

/** Grayscale, flattened on white — the shop's B&W pass, on their own stock. */
function prepareIllustration(imagesDir: string, slug: string): string | null {
  const src = join(ILLUSTRATIONS_DIR, `${slug}.png`);
  if (!existsSync(src)) return null;

  const dst = join(imagesDir, `${slug}.png`);
  if (existsSync(dst) && statSync(dst).mtimeMs > statSync(src).mtimeMs) return dst;

  // Same alpha-levelling as build-print-pdf: the transparentize pass leaves a
  // faint semi-transparent residue that shows as a rectangle once flattened.
  execFileSync(
    "magick",
    [
      src,
      "-resize", `${ILLUSTRATION_TARGET_WIDTH}x`,
      "-channel", "A", "-level", "15%,100%", "+channel",
      "-background", "white", "-flatten",
      "-colorspace", "Gray",
      "-strip", dst,
    ],
    { stdio: "inherit" },
  );
  return dst;
}

/**
 * Centre the standalone illustrations.
 *
 * book-source emits each one as a lone `![alt](path)` paragraph. Pandoc turns
 * that into a bare \includegraphics inside a paragraph, and because the print
 * preambles set \parindent=0pt it lands flush LEFT — which is why the
 * illustrations sit off to one side in the current 5×8 booklet. Rewriting them
 * as explicit raw-LaTeX center blocks fixes it without touching the shared
 * markdown that the EPUB and screen PDF also consume.
 */
function centerImages(md: string): string {
  return md.replace(
    /^!\[([^\]]*)\]\(([^)]+)\)$/gm,
    (_full, _alt: string, path: string) =>
      `\\begin{center}\n\\includegraphics[width=${ILLUSTRATION_WIDTH_FRAC}\\linewidth,` +
      `keepaspectratio]{${path}}\n\\end{center}`,
  );
}

/** LaTeX that appends `n` blank pages, or "" for none. */
function padPagesTex(n: number): string {
  if (n <= 0) return "% no padding needed — the page count is already a multiple of 4";
  const blanks = "\\thispagestyle{empty}\\null\\clearpage\n  ".repeat(n);
  return (
    `% Pad to a multiple of ${PAGES_PER_SHEET} for 2-up duplex (${n} blank ` +
    `page${n === 1 ? "" : "s"}).\n` +
    `\\AtEndDocument{%\n  \\clearpage\n  ${blanks}}`
  );
}

function renderPreamble(padPages: number): string {
  const tpl = readFileSync(join(TEMPLATE_DIR, "pdf-preamble-printshop.tex"), "utf8");
  const out = join(WORK_DIR, "preamble.tex");
  writeFileSync(
    out,
    tpl
      .replace(/__FONTS_DIR__/g, FONTS_DIR)
      .replace(/__PAD_PAGES__/g, padPagesTex(padPages)),
  );
  return out;
}

function runPandoc(bookMd: string, preamble: string, outPdf: string): void {
  execFileSync(
    "pandoc",
    [
      // implicit_figures off, or the illustrations' alt text renders as a caption.
      "--from=markdown-implicit_figures",
      "--to=pdf",
      `--pdf-engine=${findXelatex()}`,
      `--include-in-header=${preamble}`,
      "--top-level-division=chapter",
      "--toc",
      "--toc-depth=2",
      "-V", "documentclass=book",
      "-V", "classoption=twoside,openright",
      "-V", "papersize=",
      // A5 trim, no bleed — the shop cuts an A4 sheet in half and binds.
      "-V", "geometry:paperwidth=148mm",
      "-V", "geometry:paperheight=210mm",
      // Inner carries the binding; outer/top/bottom leave enough that a 3mm
      // trim on the bound block never touches type.
      "-V", "geometry:inner=20mm",
      "-V", "geometry:outer=14mm",
      "-V", "geometry:top=16mm",
      "-V", "geometry:bottom=18mm",
      "-V", `title=${BOOK_TITLE}`,
      "-V", `subtitle=${SUBTITLE_TEX}`,
      "-V", `author=${TITLE_PAGE_AUTHOR_TEX}`,
      "-V", "lang=en",
      "-V", "fontsize=12pt",
      `--output=${outPdf}`,
      bookMd,
    ],
    { stdio: "inherit", env: TEX_ENV },
  );
}

function pageCount(pdf: string): number {
  const info = execFileSync("pdfinfo", [pdf], { encoding: "utf8", env: TEX_ENV });
  const m = info.match(/^Pages:\s+(\d+)/m);
  if (!m) throw new Error(`could not read page count from ${pdf}`);
  return Number(m[1]);
}

function buildInterior(): string {
  const imagesDir = join(WORK_DIR, "images");
  mkdirSync(imagesDir, { recursive: true });

  const missing = [];
  const md = centerImages(
    buildBookMarkdown({
      getIllustrationPath: (slug) => {
        const p = prepareIllustration(imagesDir, slug);
        if (!p) missing.push(slug);
        return p;
      },
      qrCodePath: generateQrCode(SITE_URL, join(imagesDir, "qr.png")),
      printUrls: true,
    }),
  );
  if (missing.length) {
    console.warn(
      `[build-printshop-pdf] WARNING: no illustration for ${missing.join(", ")} — ` +
        `public/illustrations/ only holds what you've downloaded from the CDN. ` +
        `The book will build without them.`,
    );
  }

  const bookMd = join(WORK_DIR, "book.md");
  writeFileSync(bookMd, md);

  const outPdf = join(OUT_DIR, INTERIOR_NAME);

  // Pass 1: build unpadded just to learn the page count.
  runPandoc(bookMd, renderPreamble(0), outPdf);
  const raw = pageCount(outPdf);
  const pad = (PAGES_PER_SHEET - (raw % PAGES_PER_SHEET)) % PAGES_PER_SHEET;

  if (pad > 0) {
    // Pass 2: same source, padded to a whole number of A4 sheets.
    runPandoc(bookMd, renderPreamble(pad), outPdf);
  }
  const final = pageCount(outPdf);
  console.log(
    `[build-printshop-pdf] interior ${final} pages ` +
      `(${raw} + ${pad} blank) = ${final / PAGES_PER_SHEET} A4 sheets duplex`,
  );
  return { path: outPdf, pages: final };
}

/** Write the numbers /print quotes to the shop. */
function writeSpec(interiorPages: number, interior: string, covers: string | null): void {
  const spec = {
    _comment:
      "Generated by scripts/build-printshop-pdf.ts — do not edit by hand. " +
      "Committed because public/downloads/ is gitignored, so the /print page " +
      "can't measure the PDFs at build time.",
    trimMm: { w: TRIM_W_MM, h: TRIM_H_MM },
    interior: {
      file: INTERIOR_NAME,
      pages: interiorPages,
      sheets: interiorPages / PAGES_PER_SHEET,
      bytes: statSync(interior).size,
    },
    covers: covers
      ? { file: COVERS_NAME, pages: 2, bytes: statSync(covers).size }
      : null,
  };
  writeFileSync(SPEC_FILE, `${JSON.stringify(spec, null, 2)}\n`);
  console.log(`[build-printshop-pdf] wrote ${SPEC_FILE}`);
}

function buildCovers(): string | null {
  for (const [label, path] of [["front", FRONT_COVER], ["back", BACK_COVER]] as const) {
    if (!existsSync(path)) {
      console.warn(
        `[build-printshop-pdf] no A5 ${label} cover at ${path} — skipping the ` +
          `cover file. Run \`pnpm render-covers\` first.`,
      );
      return null;
    }
  }

  const tex = join(WORK_DIR, "covers.tex");
  writeFileSync(
    tex,
    readFileSync(join(TEMPLATE_DIR, "printshop-covers.tex"), "utf8")
      .replace(/__FRONT_COVER__/g, FRONT_COVER)
      .replace(/__BACK_COVER__/g, BACK_COVER),
  );

  execFileSync(
    findXelatex(),
    ["-interaction=nonstopmode", `-output-directory=${WORK_DIR}`, tex],
    { stdio: "inherit", env: TEX_ENV },
  );

  const built = join(WORK_DIR, "covers.pdf");
  const dest = join(OUT_DIR, COVERS_NAME);
  execFileSync("cp", [built, dest]);
  console.log(`[build-printshop-pdf] covers → ${dest}`);
  return dest;
}

function main(): void {
  mkdirSync(WORK_DIR, { recursive: true });

  const interior = buildInterior();
  publishToDownloads(interior.path, INTERIOR_NAME);

  const covers = buildCovers();
  if (covers) publishToDownloads(covers, COVERS_NAME);

  writeSpec(interior.pages, interior.path, covers);
}

main();
