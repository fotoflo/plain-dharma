/**
 * Build the Plain Dharma back covers from one parameterized XeLaTeX template.
 *
 * The FRONT cover (generate-cover.ts) just rasterizes the designer's InDesign
 * PDF. There is no InDesign back cover, so this script GENERATES one from
 * scripts/templates/back-cover.tex (Garamond Libre, brand palette, gold stitched
 * stripe on the spine/right edge), compiling with XeLaTeX and rasterizing with
 * the SAME pdftoppm → ImageMagick step the front cover uses.
 *
 * Two trims share the template via __TOKEN__ substitution:
 *   • screen — 6×9 (2:3) → dist/ebook/back-cover.jpg, published to the site.
 *   • print  — 5.25×8.25 (5×8 trim + 0.125in bleed) → back-cover-print-color.jpg
 *              and a grayscale back-cover-print-bw.jpg, consumed by build-print-pdf
 *              as the final page of each variant (not published; print-only).
 *
 * Run: pnpm generate-back-cover
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { DEFAULT_LOCALE, getSuttasInOrder } from "@plain-dharma/content";

import { ean13Tikz } from "./lib/ean13.js";
import { publishToDownloads } from "./lib/publish.js";

const __filename = fileURLToPath(import.meta.url);
const ROOT = join(dirname(__filename), "..");
const OUT_DIR = join(ROOT, "dist", "ebook");
const FONTS_DIR = join(ROOT, "src", "app", "fonts");
const TEMPLATE = join(ROOT, "scripts", "templates", "back-cover.tex");

// Rasterize hot then downscale (supersampling for clean stitch + type edges).
// 1600px wide is 2:3 = 1600×2400 on screen, and ~305 DPI on the 5.25in print
// page — above KDP's 300 DPI floor.
const TARGET_W = 1600;
const RENDER_DPI = 320;

// XeLaTeX ships with BasicTeX at /Library/TeX/texbin and isn't on $PATH until a
// new shell session — mirror build-pdf.ts and resolve it explicitly.
const TEX_BIN_DIR = "/Library/TeX/texbin";
const XELATEX_BIN = join(TEX_BIN_DIR, "xelatex");

// The numbered back-cover titles, in canonical order. Kept HERE (not pulled from
// the registry) on purpose: the back cover uses the SHORT "The Fire Sermon" for
// #3 — not the registry's longer "The Buddha's Third Talk: The Fire Sermon" —
// and the editorial title list is a layout decision local to this cover. The
// one-line descriptions UNDER each, however, are the single source of truth:
// the `teaser` fields from @plain-dharma/content, paired by canonical order.
const BACK_COVER_TITLES = [
  "The Buddha's First Talk",
  "The Buddha's Second Talk",
  "The Fire Sermon",
  "On Loving-Kindness",
  "The Foundations of Mindfulness",
  "How to Decide What to Believe",
] as const;

// ISBN of the English EPUB / ebook edition (registered with Bowker —
// docs/publishing/BOWKER_REVIEW.md). It IS the EAN-13: the 13 digits encode the
// scannable barcode printed in the screen/ebook back cover's ISBN box. The PRINT
// edition is a separate ONIX record and needs its OWN ISBN, so the print target
// below intentionally keeps a placeholder rather than reusing this number.
const EBOOK_ISBN = "978-1-891328-37-4";

// Real EAN-13 barcode + human-readable ISBN, for the ebook back cover. Lining
// figures (the main font defaults to old-style) so the digit row reads evenly.
const EBOOK_BARCODE = [
  "{\\addfontfeatures{Numbers=Lining}%",
  `{\\scriptsize\\color{ink}ISBN ${EBOOK_ISBN}}\\\\[0.16em]`,
  ean13Tikz(EBOOK_ISBN, { moduleWidth: "0.0083in", barHeight: "0.30in", fontPt: 5 }),
  "}",
].join("\n");

// Print back cover keeps the placeholder box — the paperback's barcode waits on
// its own ISBN from Ellen's 978-1-891328 block.
const PRINT_BARCODE = [
  "{\\scriptsize\\color{muted}ISBN}\\\\[0.12em]",
  "{\\color{ink}\\rule{0.8in}{0.34in}}\\\\[0.16em]",
  "{\\tiny\\color{muted}barcode placeholder}",
].join("\n");

// Escape the LaTeX specials that can appear in a teaser. Em dash "—" and
// apostrophes render fine as literals (Ligatures=TeX maps "'"), so they're left
// alone; backslash is escaped first so it doesn't double-escape the others.
function escapeLatex(s: string): string {
  return s
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

// Build the \suttaentry block injected at __SUTTA_ENTRIES__: each hardcoded
// title numbered, paired with the registry teaser for the same canonical slot.
function buildSuttaEntries(): string {
  const teasers = getSuttasInOrder(DEFAULT_LOCALE).map((m) => m.teaser);
  if (teasers.length !== BACK_COVER_TITLES.length) {
    console.error(
      `ERROR: ${BACK_COVER_TITLES.length} back-cover titles but ${teasers.length} registry teasers`
    );
    process.exit(1);
  }
  return BACK_COVER_TITLES.map(
    (title, i) =>
      `\\suttaentry{${i + 1}.\\quad ${escapeLatex(title)}}{${escapeLatex(teasers[i])}}`
  ).join("\n");
}

type Output = { file: string; grayscale: boolean; publishAs?: string };
type Target = {
  /** Log label + .tex/.pdf basename in OUT_DIR. */
  jobname: string;
  /** __TOKEN__ → value (excluding __FONTS_DIR__, applied for all targets). */
  tokens: Record<string, string>;
  /** JPEGs to emit from the one rendered page. */
  outputs: Output[];
};

const TARGETS: Target[] = [
  // ── Screen / ebook trim: 6×9, the published pair to the front cover ─────────
  {
    jobname: "back-cover",
    tokens: {
      FONTSIZE: "11pt",
      PAPER_W: "6in", PAPER_H: "9in",
      M_TOP: "0.72in", M_BOT: "0.7in", M_LEFT: "0.9in", M_RIGHT: "1.3in",
      STRIPE_W: "0.5in", STITCH_X: "0.43in",
      OV_LEFT: "0.9in", OV_RIGHT: "0.95in", OV_Y: "0.6in", OV_TEXTW: "2.6in",
      BARCODE: EBOOK_BARCODE,
    },
    outputs: [
      { file: "back-cover.jpg", grayscale: false, publishAs: "plain-dharma-back-cover.jpg" },
    ],
  },
  // ── Print trim: 5×8 + 0.125in bleed = 5.25×8.25. Cream + stripe bleed to the
  // edges; the band is widened to 0.625in so ~0.5in survives after the right
  // bleed is guillotined. Smaller page → 10pt body and tighter margins. One
  // render feeds both the color and the grayscale (B&W variant) outputs. ───────
  {
    jobname: "back-cover-print",
    tokens: {
      FONTSIZE: "10pt",
      PAPER_W: "5.25in", PAPER_H: "8.25in",
      M_TOP: "0.5in", M_BOT: "0.5in", M_LEFT: "0.55in", M_RIGHT: "1.05in",
      STRIPE_W: "0.625in", STITCH_X: "0.555in",
      OV_LEFT: "0.55in", OV_RIGHT: "0.8in", OV_Y: "0.5in", OV_TEXTW: "2.2in",
      BARCODE: PRINT_BARCODE,
    },
    outputs: [
      { file: "back-cover-print-color.jpg", grayscale: false },
      { file: "back-cover-print-bw.jpg", grayscale: true },
    ],
  },
];

function findXelatex(): string {
  return existsSync(XELATEX_BIN) ? XELATEX_BIN : "xelatex";
}

function buildTarget(target: Target): void {
  // Substitute fonts dir + the numbered sutta entries (both target-independent),
  // then this target's geometry/stripe tokens.
  let tex = readFileSync(TEMPLATE, "utf8")
    .replace(/__FONTS_DIR__/g, FONTS_DIR)
    .replace(/__SUTTA_ENTRIES__/g, buildSuttaEntries());
  for (const [token, value] of Object.entries(target.tokens)) {
    tex = tex.replace(new RegExp(`__${token}__`, "g"), value);
  }
  const texPath = join(OUT_DIR, `${target.jobname}.tex`);
  writeFileSync(texPath, tex);

  // pandoc/xelatex spawn kpsewhich/mktexfmt from /Library/TeX/texbin — prepend
  // it for the child only (it's not on PATH until the next login shell).
  const env = { ...process.env, PATH: `${TEX_BIN_DIR}:${process.env.PATH ?? ""}` };
  const xelatexArgs = [
    "-interaction=nonstopmode",
    "-halt-on-error",
    `-output-directory=${OUT_DIR}`,
    texPath,
  ];
  // Two passes: the stripe + bottom block anchor to TikZ's `current page` node,
  // which only resolves on the second run (written to the .aux on the first).
  execFileSync(findXelatex(), xelatexArgs, { stdio: "inherit", env });
  execFileSync(findXelatex(), xelatexArgs, { stdio: "inherit", env });

  const pdf = join(OUT_DIR, `${target.jobname}.pdf`);
  if (!existsSync(pdf)) {
    console.error(`ERROR: xelatex did not produce ${pdf}`);
    process.exit(1);
  }

  // ── Raster once, then emit each output (color / grayscale) from it ──────────
  const tmpPng = join(OUT_DIR, `${target.jobname}-render.png`);
  execFileSync(
    "pdftoppm",
    ["-png", "-r", String(RENDER_DPI), "-singlefile", pdf, tmpPng.replace(/\.png$/, "")],
    { stdio: "inherit" }
  );

  for (const out of target.outputs) {
    const dest = join(OUT_DIR, out.file);
    const args = [
      tmpPng,
      "-resize", `${TARGET_W}x`,
      "-colorspace", out.grayscale ? "Gray" : "sRGB",
      "-background", "white", "-flatten",
      "-strip",
      "-quality", "92",
      dest,
    ];
    execFileSync("magick", args, { stdio: "inherit" });
    console.log(`[generate-back-cover] wrote ${dest}`);
    if (out.publishAs) publishToDownloads(dest, out.publishAs);
  }

  rmSync(tmpPng, { force: true });
  // Clean the LaTeX intermediates; keep the .pdf as a print-ready vector source.
  for (const ext of ["aux", "log", "out"]) {
    rmSync(join(OUT_DIR, `${target.jobname}.${ext}`), { force: true });
  }
}

function main(): void {
  if (!existsSync(TEMPLATE)) {
    console.error(`ERROR: missing template at ${TEMPLATE}`);
    process.exit(1);
  }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  for (const target of TARGETS) buildTarget(target);
}

main();
