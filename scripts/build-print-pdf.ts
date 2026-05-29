/**
 * Build the Plain Dharma PRINT PDFs for KDP Print upload.
 *
 * Produces TWO files (one per color variant):
 *   dist/print/plain-dharma-print-bw.pdf     — white paper, grayscale illustrations
 *   dist/print/plain-dharma-print-color.pdf  — cream paper with bleed, color illustrations
 *
 * Both:
 *   - 5"×8" trim with 0.125" bleed each side → 5.25"×8.25" PDF page
 *   - Twoside book class, openright (chapters start on recto)
 *   - Mirrored margins with 0.125" binding gutter
 *   - No cover page (KDP wants the wraparound cover as a separate file —
 *     use dist/ebook/cover.jpg as the front art and dist/ebook/back-cover.jpg
 *     as the back art, run KDP's Cover Creator once you know the page count for
 *     the spine width). The back cover IS embedded in the screen PDF (build-pdf)
 *     but never in the print interior — it belongs on the external wraparound.
 *   - Hyperlinks render as plain ink (print can't follow them)
 *
 * Run: pnpm build-print-pdf
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
const OUT_DIR = join(ROOT, "dist", "print");
// Print-trim back covers (5.25×8.25 + bleed) live alongside the ebook artifacts;
// generate-back-cover.ts emits a color and a grayscale variant. Appended as the
// final page of each interior so the print PDFs are self-contained books. (KDP
// uploads still want a separate wraparound — use these same images for it.)
const EBOOK_DIR = join(ROOT, "dist", "ebook");

const ILLUSTRATION_TARGET_WIDTH = 1200; // 300 PPI at 4" displayed width
const ILLUSTRATION_JPEG_QUALITY = 88;

const XELATEX_BIN = "/Library/TeX/texbin/xelatex";

type Variant = "bw" | "color";
type VariantCfg = {
  /** Suffix on output filename + image cache dir. */
  slug: string;
  /** Replaces __PAGECOLOR_SETUP__ in the preamble template. */
  pagecolorSetup: string;
  /** Flatten illustrations onto this color. Match the page color. */
  illustrationBg: string;
  /** If true, convert illustrations to grayscale before embedding. */
  grayscale: boolean;
  /** Print-trim back cover (in dist/ebook) appended as the final page. */
  backCoverImage: string;
};

const VARIANTS: Record<Variant, VariantCfg> = {
  bw: {
    slug: "bw",
    pagecolorSetup: "% B&W variant: pages are white (no \\pagecolor needed)",
    illustrationBg: "white",
    grayscale: true,
    backCoverImage: "back-cover-print-bw.jpg",
  },
  color: {
    slug: "color",
    pagecolorSetup: "\\pagecolor{cream}",
    illustrationBg: "#F5EFE0",
    grayscale: false,
    backCoverImage: "back-cover-print-color.jpg",
  },
};

function findXelatex(): string {
  return existsSync(XELATEX_BIN) ? XELATEX_BIN : "xelatex";
}

// Per-variant illustration cache. Color variant gets full-saturation JPEGs
// flattened on cream; bw variant gets the same but converted to grayscale.
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
  if (cfg.grayscale) {
    args.push("-colorspace", "Gray");
  }
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

// Render the back-cover include for this variant, or null if its image is
// missing. Reuses the same pdf-back-cover.tex as the screen PDF — it sizes the
// image to \paperwidth × \paperheight, so it adapts to the 5.25×8.25 print page.
function renderBackCover(variant: Variant, variantDir: string): string | null {
  const cfg = VARIANTS[variant];
  const imgPath = join(EBOOK_DIR, cfg.backCoverImage);
  if (!existsSync(imgPath)) {
    console.warn(
      `[build-print-pdf:${variant}] no back cover at ${imgPath} — building ` +
        `without one. Run \`pnpm generate-back-cover\` first to include it.`
    );
    return null;
  }
  const tpl = readFileSync(join(TEMPLATE_DIR, "pdf-back-cover.tex"), "utf8");
  const rendered = tpl.replace(/__BACK_COVER_PATH__/g, imgPath);
  const out = join(variantDir, "back-cover-include.tex");
  writeFileSync(out, rendered);
  return out;
}

function runPandoc(
  variant: Variant,
  bookMdPath: string,
  preamblePath: string,
  backCoverPath: string | null,
  outPdf: string
): void {
  const args = [
    "--from=markdown",
    "--to=pdf",
    `--pdf-engine=${findXelatex()}`,
    `--include-in-header=${preamblePath}`,
    // Back cover appends itself via \AtEndDocument — also a preamble include.
    ...(backCoverPath ? [`--include-in-header=${backCoverPath}`] : []),
    "--top-level-division=chapter",
    "--toc",
    "--toc-depth=2",
    "-V", "documentclass=book",
    "-V", "classoption=twoside,openright",
    "-V", "papersize=",
    // 5"×8" trim + 0.125" bleed each side = 5.25"×8.25" PDF.
    "-V", "geometry:paperwidth=5.25in",
    "-V", "geometry:paperheight=8.25in",
    // Inner (spine side) larger to absorb binding gutter; outer holds the
    // bleed. Top/bottom asymmetric to leave room for page-number footer.
    "-V", "geometry:inner=0.875in",
    "-V", "geometry:outer=0.625in",
    "-V", "geometry:top=0.75in",
    "-V", "geometry:bottom=0.75in",
    "-V", `title=${BOOK_TITLE}`,
    "-V", `subtitle=${BOOK_SUBTITLE}`,
    "-V", `author=${AUTHOR}`,
    "-V", "lang=en",
    "-V", "fontsize=10pt", // tighter than screen — narrower text block
    `--output=${outPdf}`,
    bookMdPath,
  ];
  const env = {
    ...process.env,
    PATH: `/Library/TeX/texbin:${process.env.PATH ?? ""}`,
  };
  execFileSync("pandoc", args, { stdio: "inherit", env });
  console.log(`[build-print-pdf:${variant}] wrote ${outPdf}`);
}

function buildVariant(variant: Variant): void {
  const cfg = VARIANTS[variant];
  const variantDir = join(OUT_DIR, cfg.slug);
  const imagesDir = join(variantDir, "images");
  if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true });

  // QR can be shared across variants since it's pure black/white anyway —
  // but keep it inside the variant dir for tidiness.
  const qrPath = generateQrCode(SITE_URL, join(imagesDir, "qr.png"));

  const md = buildBookMarkdown({
    getIllustrationPath: (slug) => prepareIllustration(variant, imagesDir, slug),
    qrCodePath: qrPath,
  });
  const bookMd = join(variantDir, "book.md");
  writeFileSync(bookMd, md);

  const preamble = renderPreamble(variant, variantDir);
  const backCover = renderBackCover(variant, variantDir);
  const outPdf = join(OUT_DIR, `plain-dharma-print-${cfg.slug}.pdf`);
  runPandoc(variant, bookMd, preamble, backCover, outPdf);
}

function main(): void {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  for (const variant of Object.keys(VARIANTS) as Variant[]) {
    buildVariant(variant);
  }
}

main();
