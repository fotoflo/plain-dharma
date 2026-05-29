/**
 * Build the Plain Dharma KDP paperback package (6×9 trim).
 *
 * For each interior variant produces TWO upload-ready files in dist/kdp/:
 *   plain-dharma-kdp-interior-{bw,color}.pdf — the book block, COVER-FREE
 *       (KDP wants covers off the interior), 6×9 + 0.125in bleed, twoside.
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
 * Front/back cover art (dist/ebook/cover.jpg, back-cover.jpg) is 6×9 and reused
 * as-is — run `pnpm generate-cover` / `pnpm generate-back-cover` first.
 *
 * Run: pnpm build-kdp
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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ILLUSTRATIONS_DIR = join(ROOT, "public", "illustrations");
const FONTS_DIR = join(ROOT, "src", "app", "fonts");
const TEMPLATE_DIR = join(ROOT, "scripts", "templates");
const EBOOK_DIR = join(ROOT, "dist", "ebook");
const OUT_DIR = join(ROOT, "dist", "kdp");

const FRONT_COVER = join(EBOOK_DIR, "cover.jpg");
const BACK_COVER = join(EBOOK_DIR, "back-cover.jpg");

const ILLUSTRATION_TARGET_WIDTH = 1200; // 300 PPI at ~4in displayed width
const ILLUSTRATION_JPEG_QUALITY = 88;

const TEX_BIN_DIR = "/Library/TeX/texbin";
const XELATEX_BIN = join(TEX_BIN_DIR, "xelatex");
const TEX_ENV = { ...process.env, PATH: `${TEX_BIN_DIR}:${process.env.PATH ?? ""}` };

// KDP per-page thickness (inches), from KDP's spine-width spec. Spine = pages ×
// caliper. Color interiors print on white paper; B&W here uses cream stock.
const CALIPER = {
  white: 0.002252, // standard color & B&W on white
  cream: 0.0025, // B&W on cream
} as const;

type Variant = "bw" | "color";
type VariantCfg = {
  slug: string;
  pagecolorSetup: string;
  illustrationBg: string;
  grayscale: boolean;
  caliper: number;
};

const VARIANTS: Record<Variant, VariantCfg> = {
  bw: {
    slug: "bw",
    pagecolorSetup: "% B&W variant: white pages (no \\pagecolor)",
    illustrationBg: "white",
    grayscale: true,
    caliper: CALIPER.cream,
  },
  color: {
    slug: "color",
    pagecolorSetup: "\\pagecolor{cream}",
    illustrationBg: "#F5EFE0",
    grayscale: false,
    caliper: CALIPER.white,
  },
};

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
  const rendered = tpl
    .replace(/__FONTS_DIR__/g, FONTS_DIR)
    .replace(/__PAGECOLOR_SETUP__/g, cfg.pagecolorSetup);
  const out = join(variantDir, "preamble.tex");
  writeFileSync(out, rendered);
  return out;
}

// Cover-free 6×9 interior. Page = 6.25×9.25 (trim + 0.125in bleed all sides,
// matching the project's existing print convention; KDP accepts this — the
// inner over-bleed is absorbed by the binding). Twoside, openright.
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
    "-V", "classoption=twoside,openright",
    "-V", "papersize=",
    "-V", "geometry:paperwidth=6.25in",
    "-V", "geometry:paperheight=9.25in",
    "-V", "geometry:inner=0.875in",
    "-V", "geometry:outer=0.625in",
    "-V", "geometry:top=0.85in",
    "-V", "geometry:bottom=0.85in",
    "-V", `title=${BOOK_TITLE}`,
    "-V", `subtitle=${BOOK_SUBTITLE}`,
    "-V", `author=${AUTHOR}`,
    "-V", "lang=en",
    "-V", "fontsize=11pt",
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

// Wraparound cover sized to this interior's spine. width = bleed + 6 + spine +
// 6 + bleed; height = 9 + 2×bleed. Compiled twice for the current-page node.
function buildWrapCover(
  variant: Variant,
  pages: number,
  variantDir: string,
  outPdf: string
): void {
  const cfg = VARIANTS[variant];
  const spineIn = pages * cfg.caliper;
  const paperW = 0.125 + 6 + spineIn + 6 + 0.125;
  const paperH = 9 + 0.25;
  const fmt = (n: number) => `${n.toFixed(4)}in`;
  console.log(
    `[build-kdp:${variant}] ${pages} pages → spine ${spineIn.toFixed(4)}in; ` +
      `wrap ${fmt(paperW)} × ${fmt(paperH)}`
  );

  const tpl = readFileSync(join(TEMPLATE_DIR, "kdp-wrap-cover.tex"), "utf8");
  const rendered = tpl
    .replace(/__PAPER_W__/g, fmt(paperW))
    .replace(/__PAPER_H__/g, fmt(paperH))
    .replace(/__SPINE_W__/g, fmt(spineIn))
    .replace(/__BACK_IMG__/g, BACK_COVER)
    .replace(/__FRONT_IMG__/g, FRONT_COVER);
  const jobname = `kdp-cover-${cfg.slug}`;
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
  const variantDir = join(OUT_DIR, cfg.slug);
  const imagesDir = join(variantDir, "images");
  if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true });

  const qrPath = generateQrCode(SITE_URL, join(imagesDir, "qr.png"));
  const md = buildBookMarkdown({
    getIllustrationPath: (slug) => prepareIllustration(variant, imagesDir, slug),
    qrCodePath: qrPath,
  });
  const bookMd = join(variantDir, "book.md");
  writeFileSync(bookMd, md);

  const preamble = renderPreamble(variant, variantDir);
  const interiorPdf = join(OUT_DIR, `plain-dharma-kdp-interior-${cfg.slug}.pdf`);
  buildInterior(variant, bookMd, preamble, interiorPdf);

  const pages = pageCount(interiorPdf);
  const coverPdf = join(OUT_DIR, `plain-dharma-kdp-cover-${cfg.slug}.pdf`);
  buildWrapCover(variant, pages, variantDir, coverPdf);
}

function main(): void {
  for (const img of [FRONT_COVER, BACK_COVER]) {
    if (!existsSync(img)) {
      console.error(
        `ERROR: missing cover art ${img}. Run \`pnpm generate-cover\` and ` +
          `\`pnpm generate-back-cover\` first.`
      );
      process.exit(1);
    }
  }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  for (const variant of Object.keys(VARIANTS) as Variant[]) {
    buildVariant(variant);
  }
}

main();
