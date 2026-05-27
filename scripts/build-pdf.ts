/**
 * Build the Plain Dharma screen PDF for sale on plaindharma.com.
 *
 * 6×9 inch trim, Garamond Libre typography, hyperlinks live, single-page
 * layout (no facing pages / bleed — that's the separate print-PDF build).
 *
 * Pipeline:
 *   1. Resize illustrations to ~1200px wide PNG (preserves transparency, no
 *      flatten — the PDF page is cream so it doesn't matter visually, and
 *      keeping PNG avoids JPEG ringing on the ink line edges)
 *   2. Assemble the same book markdown the EPUB uses (via shared book-source)
 *   3. Render scripts/templates/pdf-preamble.tex with the absolute font dir
 *   4. Shell out to pandoc with --pdf-engine=xelatex and the rendered preamble
 *
 * Output: dist/pdf/plain-dharma.pdf
 *
 * Run: pnpm build-pdf
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
  AUTHOR,
  BOOK_SUBTITLE,
  BOOK_TITLE,
  SITE_URL,
  buildBookMarkdown,
  generateQrCode,
} from "./lib/book-source.js";

const __filename = fileURLToPath(import.meta.url);
const ROOT = join(dirname(__filename), "..");
const ILLUSTRATIONS_DIR = join(ROOT, "public", "illustrations");
const FONTS_DIR = join(ROOT, "src", "app", "fonts");
const TEMPLATE_DIR = join(ROOT, "scripts", "templates");
const OUT_DIR = join(ROOT, "dist", "pdf");
const IMAGES_DIR = join(OUT_DIR, "images");
const COVER_PATH = join(ROOT, "dist", "ebook", "cover.jpg");

// Illustrations are rendered at 70% of \linewidth on a 6" page = ~4.2"; at
// 1000px source that's ~240 PPI which is sharp on screen and acceptable at
// print review. JPEG q=85 with the source PNG flattened onto cream drops
// each from ~1.5 MB raw-PNG-with-smask down to ~50 KB. Flattening color
// must match `\pagecolor{cream}` in pdf-preamble.tex (#F5EFE0).
const ILLUSTRATION_TARGET_WIDTH = 1000;
const ILLUSTRATION_JPEG_QUALITY = 85;
const ILLUSTRATION_BG = "#F5EFE0"; // matches \pagecolor{cream} in preamble

// xelatex from BasicTeX is installed at /Library/TeX/texbin/. It's not on
// $PATH by default until the next shell session, so we use the absolute path.
const XELATEX_BIN = "/Library/TeX/texbin/xelatex";

function findXelatex(): string {
  if (existsSync(XELATEX_BIN)) return XELATEX_BIN;
  return "xelatex"; // fall back to PATH lookup
}

// Resize + flatten source PNG to a width-bounded JPEG cache. We could keep
// PNG transparency, but pandoc/xdvipdfmx embed PNG as raw RGB + smask which
// inflated the PDF ~6× without measurable quality gain on a white-page PDF.
function prepareIllustration(slug: string): string | null {
  const src = join(ILLUSTRATIONS_DIR, `${slug}.png`);
  if (!existsSync(src)) return null;

  const dst = join(IMAGES_DIR, `${slug}.jpg`);
  const srcMtime = statSync(src).mtimeMs;
  const dstMtime = existsSync(dst) ? statSync(dst).mtimeMs : 0;
  if (dstMtime > srcMtime) return dst;

  execFileSync(
    "magick",
    [
      src,
      "-resize", `${ILLUSTRATION_TARGET_WIDTH}x`,
      "-background", ILLUSTRATION_BG,
      "-flatten",
      "-quality", String(ILLUSTRATION_JPEG_QUALITY),
      "-strip",
      "-interlace", "Plane",
      dst,
    ],
    { stdio: "inherit" }
  );
  return dst;
}

function ensureOutDir(): void {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true });
}

// Inline the absolute fonts dir into the preamble. fontspec's Path= option
// won't expand a relative path reliably from pandoc's working dir, so we
// resolve it here and write a copy of the preamble to dist/pdf/.
function renderPreamble(): string {
  const tpl = readFileSync(join(TEMPLATE_DIR, "pdf-preamble.tex"), "utf8");
  const rendered = tpl.replace(/__FONTS_DIR__/g, FONTS_DIR);
  const out = join(OUT_DIR, "preamble.tex");
  writeFileSync(out, rendered);
  return out;
}

// Returns the path to the rendered cover .tex include, or null if no cover
// exists (in which case the PDF is built without one).
function renderCover(): string | null {
  if (!existsSync(COVER_PATH)) {
    console.warn(
      `[build-pdf] no cover at ${COVER_PATH} — building PDF without one. ` +
        `Run \`pnpm generate-cover\` first to include it.`
    );
    return null;
  }
  const tpl = readFileSync(join(TEMPLATE_DIR, "pdf-cover.tex"), "utf8");
  const rendered = tpl.replace(/__COVER_PATH__/g, COVER_PATH);
  const out = join(OUT_DIR, "cover-include.tex");
  writeFileSync(out, rendered);
  return out;
}

function runPandoc(
  bookMdPath: string,
  preamblePath: string,
  coverPath: string | null
): void {
  const outPdf = join(OUT_DIR, "plain-dharma.pdf");
  const luaFilter = join(TEMPLATE_DIR, "center-images.lua");
  const args = [
    "--from=markdown",
    "--to=pdf",
    `--pdf-engine=${findXelatex()}`,
    `--include-in-header=${preamblePath}`,
    `--lua-filter=${luaFilter}`,
    "--top-level-division=chapter",
    "--toc",
    "--toc-depth=2",
  ];
  // Cover goes via include-in-header (not before-body): it uses
  // \AtBeginDocument to insert itself before pandoc's \maketitle, which
  // requires being defined in the LaTeX preamble.
  if (coverPath) {
    args.push(`--include-in-header=${coverPath}`);
  }
  args.push(
    "-V", "documentclass=book",
    // openany: chapters open on any page (left or right). The default
    // (openright) padded blank pages before the cover and after each chapter,
    // which is fine for print but wrong for a single-sided screen PDF.
    "-V", "classoption=openany",
    "-V", "papersize=",
    "-V", "geometry:paperwidth=6in",
    "-V", "geometry:paperheight=9in",
    "-V", "geometry:top=0.85in",
    "-V", "geometry:bottom=0.85in",
    "-V", "geometry:left=0.85in",
    "-V", "geometry:right=0.85in",
    "-V", `title=${BOOK_TITLE}`,
    "-V", `subtitle=${BOOK_SUBTITLE}`,
    "-V", `author=${AUTHOR}`,
    "-V", "lang=en",
    "-V", "fontsize=11pt",
    "-V", "colorlinks=true",
    "-V", "linkcolor=ink",
    "-V", "urlcolor=linkcolor",
    "-V", "toccolor=ink",
    `--output=${outPdf}`,
    bookMdPath
  );
  // pandoc spawns xelatex, which spawns kpsewhich/mktexfmt — all live in
  // /Library/TeX/texbin. That dir isn't on PATH until a new shell session
  // (BasicTeX installs via path_helper). Prepend it for this child only.
  const env = {
    ...process.env,
    PATH: `/Library/TeX/texbin:${process.env.PATH ?? ""}`,
  };
  execFileSync("pandoc", args, { stdio: "inherit", env });
  console.log(`\n[build-pdf] wrote ${outPdf}`);
}

function main(): void {
  ensureOutDir();
  const qrPath = generateQrCode(SITE_URL, join(IMAGES_DIR, "qr.png"));
  const md = buildBookMarkdown({
    getIllustrationPath: prepareIllustration,
    qrCodePath: qrPath,
  });
  const bookMd = join(OUT_DIR, "book.md");
  writeFileSync(bookMd, md);
  const preamble = renderPreamble();
  const coverInclude = renderCover();
  runPandoc(bookMd, preamble, coverInclude);
}

main();
