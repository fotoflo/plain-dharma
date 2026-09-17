/**
 * Build the Plain Dharma PRINT-SHOP editions — the files you hand a copy shop.
 *
 * Produces FOUR files in dist/printshop/ (and publishes all four to
 * public/downloads):
 *   plain-dharma-printshop-a5.pdf         — A5 interior, B&W, 12pt
 *   plain-dharma-printshop-a5-covers.pdf  — 2 pages, color, A4 with crop marks
 *   plain-dharma-printshop-a6.pdf         — A6 interior, B&W, 12pt
 *   plain-dharma-printshop-a6-covers.pdf  — 2 pages, color, A4 with crop marks
 *
 * Why two files per edition: the shop runs the covers on card in a color pass
 * and the interior in a B&W pass. Handed one mixed PDF they will either print
 * the whole thing in color (expensive) or miss the cover pages entirely.
 *
 * Why A-series: two A5 pages — or four A6 pages — tile an A4 sheet exactly,
 * which is how the shop prints them (n-up, duplex, cut, bind). The 5.25×8.25
 * print PDF isn't an A-size, so a shop can only centre it on A4 and waste the
 * margins, or scale it and guess. That's what made the first attempt come out
 * small.
 *
 * Why both A5 AND A6: same book, same 12pt type, different pocket. A5 is the
 * one you read at a table; A6 is the one that goes in a shirt pocket and gets
 * left on a bus. A6 is NOT a shrunk A5 — the type stays at 12pt, which is the
 * whole point: these get read aloud and passed around, and an edition that
 * bought its size back out of the type would be the wrong thing to hand anyone.
 *
 * The measured result of holding the type fixed: A6 runs 72 pages to A5's 52,
 * but eight A6 pages fit a duplexed A4 sheet against A5's four, so a copy comes
 * out at 9 sheets instead of 13. The pocket edition is the cheaper one to print.
 *
 * The pages are deliberately NOT imposed. Every shop's driver does n-up itself
 * and controls the duplex flip; pre-imposing would hard-code one binding method
 * and one flip direction into the file, and break silently if either differs.
 *
 * Printing instructions live at /print on the site, not in the PDF — so the
 * book is just the book, and the spec can be corrected without a rebuild.
 *
 * Run: pnpm build-printshop-pdf   (needs pandoc, xelatex, ImageMagick)
 *
 * PRINTSHOP_KEEP_SIZES=1 leaves the file sizes in printshop-spec.json alone —
 * for rebuilding the page counts with stand-in illustrations. See
 * sizesAreMeaningless().
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

// The /print page needs the page and sheet counts to tell the shop what they're
// printing, but public/downloads/ is gitignored — the built PDFs aren't there in
// CI. So the build writes the numbers into this committed JSON, the same way the
// audio manifests stay in git while the mp3s live on the CDN.
const SPEC_FILE = join(ROOT, "src", "content", "printshop-spec.json");

// 300dpi at the ~75mm displayed width would be 886px; 1200 leaves headroom for
// a shop that prints at 400dpi without bloating the file. Shared by both
// editions — A6 displays them smaller, which only means more dots per mm.
const ILLUSTRATION_TARGET_WIDTH = 1200;

// Displayed illustration width, as a fraction of the measure. Same on both
// editions, so the drawing keeps its proportion to the text block.
const ILLUSTRATION_WIDTH_FRAC = 0.66;

// Duplex doubles whatever the sheet holds per side.
const SIDES_PER_SHEET = 2;

// A4, in mm — every print-shop sheet, interior and covers alike.
const A4_W_MM = 210;
const A4_H_MM = 297;

// Bleed on the cover art, in mm per edge: the art runs past the cut line so a
// drifting blade never exposes a white hairline.
const COVER_BLEED_MM = 3;

// Crop marks are 8mm long and stop 2mm clear of the bleed box, so each one
// starts 10mm out from the bleed edge. Kept here because the covers template
// takes the finished coordinates, not the rule.
const MARK_LEN_MM = 8;
const MARK_GAP_MM = 2;

// Measured on the A5 edition: a 114mm measure sets ~62 characters per line in
// 12pt Garamond Libre. Used only to report the line length per edition, so a
// future margin change shows its effect on readability in the build log rather
// than in a printed proof.
const CHARS_PER_MM = 62 / 114;

type Margins = { inner: number; outer: number; top: number; bottom: number };

type Edition = {
  key: "a5" | "a6";
  /** Human label — also stamped into the cover sheets and the PDF metadata. */
  label: string;
  /** Trim size in mm. */
  trimW: number;
  trimH: number;
  /** Pages per A4 SIDE. Duplex doubles it: that's the pad multiple. */
  up: number;
  margins: Margins;
  /** LaTeX size command for chapter/section titles — steps down with the trim. */
  chapterSize: string;
  sectionSize: string;
  /** Chapter title spacing, in pt: before, after. */
  chapterBefore: number;
  chapterAfter: number;
  /** LaTeX re-laying the running heads, or "" to keep the book class default. */
  headerTuning: string;
  /** LaTeX re-laying the table of contents, or "" to keep the class default. */
  tocTuning: string;
  interiorName: string;
  coversName: string;
  /** Cover art at this trim + 3mm bleed, rendered by render-covers.ts. */
  frontCover: string;
  backCover: string;
};

/**
 * The two print-shop trims. Everything that differs between them lives here —
 * the templates are shared and tokenised, so the editions can't drift apart in
 * any way that isn't written down on this table.
 *
 * Margins: the inner carries the binding, and outer/top/bottom leave enough
 * that a 3mm trim on the bound block never touches type. A6's are scaled from
 * A5's by trim, then the inner is held back up — A6 runs 72 pages to A5's 52 in
 * a page two thirds the width, so it needs proportionally MORE gutter, not less,
 * or the inside margin disappears into a perfect-bound spine.
 */
const EDITIONS: Edition[] = [
  {
    key: "a5",
    label: "A5",
    trimW: 148,
    trimH: 210,
    up: 2,
    margins: { inner: 20, outer: 14, top: 16, bottom: 18 },
    chapterSize: "\\LARGE",
    sectionSize: "\\Large",
    chapterBefore: 28,
    chapterAfter: 22,
    // The class defaults already fit the 114mm measure, and this edition is
    // published — leaving the heads and the contents alone keeps its pagination
    // exactly where the spec, the site and anyone's print order say it is.
    headerTuning: "",
    tocTuning: "",
    interiorName: "plain-dharma-printshop-a5.pdf",
    coversName: "plain-dharma-printshop-a5-covers.pdf",
    frontCover: join(EBOOK_DIR, "front-cover-a5-color.jpg"),
    backCover: join(EBOOK_DIR, "back-cover-a5-color.jpg"),
  },
  {
    key: "a6",
    label: "A6",
    trimW: 105,
    trimH: 148,
    up: 4,
    // 83mm of measure sets ~45 characters per line at 12pt — under the 60–75
    // comfort band, and unavoidable: A6 is 105mm wide and the type is fixed at
    // 12pt by design. Buying line length back would mean either shrinking the
    // type (which is the one thing this edition exists NOT to do) or cutting the
    // gutter below what a 72-page perfect-bound block can spare.
    margins: { inner: 14, outer: 8, top: 10, bottom: 12 },
    chapterSize: "\\Large",
    sectionSize: "\\large",
    chapterBefore: 20,
    chapterAfter: 16,
    // At the class's default size "5. THE FOUNDATIONS OF MINDFULNESS" is wider
    // than the 83mm measure: it collided with the page number on one side and
    // ran past the text block on the other. fancyhdr re-lays the same heads one
    // size down, with the marks defined explicitly so they read exactly as A5's
    // do (chapter on the verso, section on the recto) rather than picking up
    // fancyhdr's own "Chapter N." default.
    headerTuning: [
      "\\usepackage{fancyhdr}",
      "\\pagestyle{fancy}",
      "\\fancyhf{}",
      "\\renewcommand{\\headrulewidth}{0pt}",
      "\\setlength{\\headheight}{14pt}",
      // The chapter titles already carry their own ordinal ("5. The Foundations
      // of Mindfulness"), and the counter is never advanced, so prefixing
      // \\thechapter here stamped a literal "0." in front of every head.
      "\\renewcommand{\\chaptermark}[1]{\\markboth{#1}{}}",
      "\\renewcommand{\\sectionmark}[1]{\\markright{#1}}",
      // One size down is enough for every head but the longest chapter title,
      // "3. THE BUDDHA'S THIRD TALK: THE FIRE SERMON", which still overran the
      // measure — and a head that doesn't fit doesn't clip, it WRAPS, and the
      // second line drops straight through the 14pt head box into the first
      // line of body text. So the head measures itself and steps down until it
      // fits on one line. Self-adjusting rather than tuned to today's titles:
      // a longer heading added later can't reintroduce the collision.
      "\\newlength{\\pdheadmax}",
      "\\newlength{\\pdheadwd}",
      // Leave room for the page number sitting at the other end of the line.
      "\\AtBeginDocument{\\setlength{\\pdheadmax}{\\dimexpr\\textwidth-9mm\\relax}}",
      "\\newcommand{\\pdheadfit}[1]{%",
      "  \\begingroup",
      "  \\footnotesize\\itshape",
      "  \\settowidth{\\pdheadwd}{#1}%",
      "  \\ifdim\\pdheadwd>\\pdheadmax",
      "    \\scriptsize\\settowidth{\\pdheadwd}{#1}%",
      "    \\ifdim\\pdheadwd>\\pdheadmax \\tiny\\fi",
      "  \\fi",
      "  #1%",
      "  \\endgroup}",
      "\\fancyhead[LE,RO]{\\footnotesize\\thepage}",
      "\\fancyhead[RE]{\\pdheadfit{\\MakeUppercase{\\leftmark}}}",
      "\\fancyhead[LO]{\\pdheadfit{\\MakeUppercase{\\rightmark}}}",
      "% Chapter openers stay plain, page number at the foot, as the class intends.",
      "\\fancypagestyle{plain}{%",
      "  \\fancyhf{}%",
      "  \\renewcommand{\\headrulewidth}{0pt}%",
      "  \\fancyfoot[C]{\\footnotesize\\thepage}%",
      "}",
    ].join("\n"),
    // The longest chapter entry — "3. The Buddha's Third Talk: The Fire Sermon"
    // — is wider than the contents measure, and the class's defaults turned that
    // into two separate faults: TeX hyphenated it to "The Fire Ser-", then broke
    // the page between the halves, stranding "mon" alone at the top of the next
    // page carrying the page number. It has to wrap here; it just has to wrap
    // like a title. So: no hyphenation, no break between an entry's own lines,
    // and a little of the page-number gutter handed back to the text (the
    // numbers only ever run to two oldstyle digits, nothing like 1.55em wide).
    tocTuning: [
      "\\usepackage{etoolbox}",
      "\\makeatletter",
      "\\renewcommand{\\@pnumwidth}{1.3em}",
      "\\renewcommand{\\@tocrmarg}{2.1em}",
      "\\makeatother",
      "\\pretocmd{\\tableofcontents}{%",
      "  \\begingroup",
      "  \\hyphenpenalty=10000 \\exhyphenpenalty=10000 \\interlinepenalty=10000",
      "  \\relax",
      "}{}{}",
      "\\apptocmd{\\tableofcontents}{\\endgroup}{}{}",
      // \\l@chapter justifies to \\rightskip=\\@pnumwidth, so a wrapped entry's
      // first line is stretched across the measure — "3.  The  Buddha's  Third
      // Talk:  The  Fire". Adding fil stretch lets that line end ragged, which
      // is how a title wrapping in a contents list should look. Section entries
      // are untouched: their dot leaders already absorb the slack.
      //
      // The second patch pays for the first. The page number is pushed right by
      // an \\hfil, which is the same order of infinity as the stretch just added,
      // so the two split the slack and every chapter's number drifted in from
      // the margin. \\hfill outranks fil, so the number goes hard right again and
      // only the lines that aren't an entry's last stay ragged.
      "\\makeatletter",
      "\\patchcmd{\\l@chapter}{\\rightskip \\@pnumwidth}%",
      "  {\\rightskip \\@pnumwidth plus 1fil}{}%",
      "  {\\message{[plaindharma] WARNING: l@chapter rightskip patch FAILED}}",
      "\\patchcmd{\\l@chapter}{\\hfil\\nobreak\\hb@xt@\\@pnumwidth}%",
      "  {\\hfill\\nobreak\\hb@xt@\\@pnumwidth}{}%",
      "  {\\message{[plaindharma] WARNING: l@chapter pnum patch FAILED}}",
      "\\makeatother",
    ].join("\n"),
    interiorName: "plain-dharma-printshop-a6.pdf",
    coversName: "plain-dharma-printshop-a6-covers.pdf",
    frontCover: join(EBOOK_DIR, "front-cover-a6-color.jpg"),
    backCover: join(EBOOK_DIR, "back-cover-a6-color.jpg"),
  },
];

/** Pages on one A4 sheet, both sides — the multiple the page count must hit. */
const pagesPerSheet = (e: Edition): number => e.up * SIDES_PER_SHEET;

/** Text-block width in mm. */
const measure = (e: Edition): number => e.trimW - e.margins.inner - e.margins.outer;

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

/** LaTeX that appends `n` blank pages, or a note for none. */
function padPagesTex(n: number, perSheet: number): string {
  if (n <= 0) {
    return `% no padding needed — the page count is already a multiple of ${perSheet}`;
  }
  const blanks = "\\thispagestyle{empty}\\null\\clearpage\n  ".repeat(n);
  return (
    `% Pad to a multiple of ${perSheet} for n-up duplex (${n} blank ` +
    `page${n === 1 ? "" : "s"}).\n` +
    `\\AtEndDocument{%\n  \\clearpage\n  ${blanks}}`
  );
}

/** Fill every __TOKEN__ in `tpl` from `vars`. */
function fillTokens(tpl: string, vars: Record<string, string | number>): string {
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    // Replacement is a function so a `$` in a path can't act as a capture ref.
    out = out.replace(new RegExp(`__${k}__`, "g"), () => String(v));
  }
  return out;
}

function renderPreamble(e: Edition, padPages: number): string {
  const tpl = readFileSync(join(TEMPLATE_DIR, "pdf-preamble-printshop.tex"), "utf8");
  const out = join(WORK_DIR, `preamble-${e.key}.tex`);
  writeFileSync(
    out,
    fillTokens(tpl, {
      FONTS_DIR,
      EDITION: e.label,
      TRIM: `${e.trimW} × ${e.trimH} mm`,
      MEASURE: measure(e),
      CPL: Math.round(measure(e) * CHARS_PER_MM),
      UP: e.up,
      PAGES_PER_SHEET: pagesPerSheet(e),
      CHAPTER_SIZE: e.chapterSize,
      SECTION_SIZE: e.sectionSize,
      CHAPTER_BEFORE: e.chapterBefore,
      CHAPTER_AFTER: e.chapterAfter,
      HEADER_TUNING:
        e.headerTuning || "% running heads: book class default (fits this measure)",
      TOC_TUNING:
        e.tocTuning || "% contents: book class default (fits this measure)",
      PAD_PAGES: padPagesTex(padPages, pagesPerSheet(e)),
    }),
  );
  return out;
}

function runPandoc(e: Edition, bookMd: string, preamble: string, outPdf: string): void {
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
      // Trim, no bleed — the shop cuts the A4 sheet down and binds.
      "-V", `geometry:paperwidth=${e.trimW}mm`,
      "-V", `geometry:paperheight=${e.trimH}mm`,
      "-V", `geometry:inner=${e.margins.inner}mm`,
      "-V", `geometry:outer=${e.margins.outer}mm`,
      "-V", `geometry:top=${e.margins.top}mm`,
      "-V", `geometry:bottom=${e.margins.bottom}mm`,
      "-V", `title=${BOOK_TITLE}`,
      "-V", `subtitle=${subtitleTex(e)}`,
      "-V", `author=${TITLE_PAGE_AUTHOR_TEX}`,
      "-V", "lang=en",
      "-V", "fontsize=12pt",
      `--output=${outPdf}`,
      bookMd,
    ],
    { stdio: "inherit", env: TEX_ENV },
  );
}

/**
 * The print-shop measures are narrow enough that the subtitle wraps to
 * "...in Modern / English", stranding one word. Break it where the covers break
 * it instead — that pairing is fixed, so the title page and the cover agree.
 * A6 is narrower still and needs the earlier break, or the first line overruns.
 */
function subtitleTex(e: Edition): string {
  return e.key === "a6"
    ? BOOK_SUBTITLE.replace(" Foundational Teachings", "\\\\Foundational Teachings").replace(
        " in Modern English",
        "\\\\in Modern English",
      )
    : BOOK_SUBTITLE.replace(" in Modern English", "\\\\in Modern English");
}

function pageCount(pdf: string): number {
  const info = execFileSync("pdfinfo", [pdf], { encoding: "utf8", env: TEX_ENV });
  const m = info.match(/^Pages:\s+(\d+)/m);
  if (!m) throw new Error(`could not read page count from ${pdf}`);
  return Number(m[1]);
}

type Built = { path: string; pages: number };

function buildInterior(e: Edition, bookMd: string): Built {
  const outPdf = join(OUT_DIR, e.interiorName);
  const perSheet = pagesPerSheet(e);

  // Pass 1: build unpadded just to learn the page count.
  runPandoc(e, bookMd, renderPreamble(e, 0), outPdf);
  const raw = pageCount(outPdf);
  const pad = (perSheet - (raw % perSheet)) % perSheet;

  if (pad > 0) {
    // Pass 2: same source, padded to a whole number of A4 sheets.
    runPandoc(e, bookMd, renderPreamble(e, pad), outPdf);
  }
  const final = pageCount(outPdf);
  console.log(
    `[build-printshop-pdf] ${e.label} interior ${final} pages ` +
      `(${raw} + ${pad} blank) = ${final / perSheet} A4 sheets duplex, ` +
      `${measure(e)}mm measure (~${Math.round(measure(e) * CHARS_PER_MM)} chars/line)`,
  );
  return { path: outPdf, pages: final };
}

/**
 * Cover-sheet geometry for one edition: the art centred on an A4 sheet, and the
 * eight crop marks that tell the shop where to cut. Everything derives from the
 * trim, so a new size needs no new arithmetic.
 *
 * Marks sit ON the trim lines in one axis and start `MARK_GAP_MM` clear of the
 * bleed box in the other, so the art never prints over them.
 */
function coverGeometry(e: Edition): Record<string, string | number> {
  const bleedW = e.trimW + COVER_BLEED_MM * 2;
  const bleedH = e.trimH + COVER_BLEED_MM * 2;
  const bleedSide = (A4_W_MM - bleedW) / 2;
  const bleedTB = (A4_H_MM - bleedH) / 2;
  const trimSide = (A4_W_MM - e.trimW) / 2;
  const trimTB = (A4_H_MM - e.trimH) / 2;
  const out = MARK_LEN_MM + MARK_GAP_MM;

  return {
    EDITION: e.label,
    TRIM_W: e.trimW,
    TRIM_H: e.trimH,
    BLEED_W: bleedW,
    BLEED_H: bleedH,
    BLEED_SIDE: bleedSide,
    BLEED_TB: bleedTB,
    TRIM_SIDE: trimSide,
    TRIM_TB: trimTB,
    // Horizontal marks: at the two trim heights, reaching in from each side.
    HMARK_XL: bleedSide - out,
    HMARK_XR: A4_W_MM - bleedSide + MARK_GAP_MM,
    HMARK_YB: trimTB,
    HMARK_YT: A4_H_MM - trimTB,
    // Vertical marks: at the two trim widths, reaching down/up from each edge.
    VMARK_XL: trimSide,
    VMARK_XR: A4_W_MM - trimSide,
    VMARK_YB: bleedTB - out,
    VMARK_YT: A4_H_MM - bleedTB + MARK_GAP_MM,
  };
}

function buildCovers(e: Edition): Built | null {
  for (const [label, path] of [
    ["front", e.frontCover],
    ["back", e.backCover],
  ] as const) {
    if (!existsSync(path)) {
      console.warn(
        `[build-printshop-pdf] no ${e.label} ${label} cover at ${path} — skipping ` +
          `the ${e.label} cover file. Run \`pnpm render-covers\` first.`,
      );
      return null;
    }
  }

  const tex = join(WORK_DIR, `covers-${e.key}.tex`);
  writeFileSync(
    tex,
    fillTokens(readFileSync(join(TEMPLATE_DIR, "printshop-covers.tex"), "utf8"), {
      ...coverGeometry(e),
      FRONT_COVER: e.frontCover,
      BACK_COVER: e.backCover,
    }),
  );

  execFileSync(
    findXelatex(),
    ["-interaction=nonstopmode", `-output-directory=${WORK_DIR}`, tex],
    { stdio: "inherit", env: TEX_ENV },
  );

  const built = join(WORK_DIR, `covers-${e.key}.pdf`);
  const dest = join(OUT_DIR, e.coversName);
  execFileSync("cp", [built, dest]);
  console.log(`[build-printshop-pdf] ${e.label} covers → ${dest}`);
  return { path: dest, pages: 2 };
}

/**
 * Assemble the shared book markdown once and reuse it for every edition.
 *
 * Both editions embed the same grayscale images at the same fraction of their
 * own measure, so there is nothing edition-specific in here — and preparing the
 * illustrations once keeps the ImageMagick pass off the second build.
 */
function buildBookMd(): { path: string; illustrationsComplete: boolean } {
  const imagesDir = join(WORK_DIR, "images");
  mkdirSync(imagesDir, { recursive: true });

  const missing: string[] = [];
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
        `The book still builds, but its pages and its file size are both a book ` +
        `with holes in it. The file sizes are therefore NOT written to ` +
        `printshop-spec.json this run (see keepMeasuredBytes), and the page ` +
        `counts are only trustworthy if whatever stood in for the missing ` +
        `illustrations had their aspect ratio. Pull the illustrations before ` +
        `committing a rebuilt spec.`,
    );
  }

  const bookMd = join(WORK_DIR, "book.md");
  writeFileSync(bookMd, md);
  return { path: bookMd, illustrationsComplete: missing.length === 0 };
}

type SpecEdition = {
  key: Edition["key"];
  label: string;
  trimMm: { w: number; h: number };
  up: number;
  pagesPerSheet: number;
  gutterMm: number;
  interior: { file: string; pages: number; sheets: number; bytes: number | null };
  covers: { file: string; pages: number; bytes: number | null } | null;
};

/**
 * True when this build must not publish file sizes.
 *
 * A build without the illustrations produces a PDF that is the right shape and
 * the wrong weight — the A5 interior drops from 1.7MB to about 110KB when the
 * six drawings aren't there. Page counts survive that (the layout only needs the
 * images' aspect ratio), but the size does not, and /print prints the size on
 * the download card.
 *
 * Two ways to be in that position:
 *   - the illustrations simply aren't in public/illustrations/, which we detect;
 *   - or they are, but they're stand-ins — blank PNGs at the right aspect ratio,
 *     which is how you reproduce the real pagination on a machine that can't
 *     reach the CDN. The layout is then exact and the weight is meaningless, and
 *     nothing in the file system says so. Export PRINTSHOP_KEEP_SIZES=1 for that
 *     case: page counts are written as measured, sizes are left alone.
 */
function sizesAreMeaningless(illustrationsComplete: boolean): boolean {
  return !illustrationsComplete || process.env.PRINTSHOP_KEEP_SIZES === "1";
}

/**
 * Byte size for one built file, or null if this build has no business claiming
 * one — in which case it carries forward whatever the committed spec already had
 * for that same file, and writes null if there was nothing to carry.
 */
function keepMeasuredBytes(
  path: string,
  file: string,
  complete: boolean,
  previous: Map<string, number>,
): number | null {
  if (!sizesAreMeaningless(complete)) return statSync(path).size;
  return previous.get(file) ?? null;
}

/** File name → byte size from the spec currently committed, for the above. */
function previousBytes(): Map<string, number> {
  const out = new Map<string, number>();
  if (!existsSync(SPEC_FILE)) return out;
  try {
    const prev = JSON.parse(readFileSync(SPEC_FILE, "utf8")) as {
      editions?: { interior?: { file: string; bytes: number | null };
                   covers?: { file: string; bytes: number | null } | null }[];
    };
    for (const e of prev.editions ?? []) {
      for (const f of [e.interior, e.covers]) {
        if (f && typeof f.bytes === "number") out.set(f.file, f.bytes);
      }
    }
  } catch {
    // A malformed or first-run spec is not a build failure — just measure fresh.
  }
  return out;
}

/** Write the numbers /print quotes to the shop. */
function writeSpec(editions: SpecEdition[]): void {
  const spec = {
    _comment:
      "Generated by scripts/build-printshop-pdf.ts — do not edit by hand. " +
      "Committed because public/downloads/ is gitignored, so the /print page " +
      "can't measure the PDFs at build time. Editions are listed in the order " +
      "/print offers them.",
    editions,
  };
  writeFileSync(SPEC_FILE, `${JSON.stringify(spec, null, 2)}\n`);
  console.log(`[build-printshop-pdf] wrote ${SPEC_FILE}`);
  if (editions.some((e) => e.interior.bytes === null || e.covers?.bytes === null)) {
    console.warn(
      "[build-printshop-pdf] NOTE: some file sizes were left unset — /print " +
        "hides the size on those cards. Rebuild with the real illustrations in " +
        "public/illustrations/ (and without PRINTSHOP_KEEP_SIZES) to fill them in.",
    );
  }
}

function main(): void {
  mkdirSync(WORK_DIR, { recursive: true });
  const { path: bookMd, illustrationsComplete } = buildBookMd();
  const previous = previousBytes();

  const spec: SpecEdition[] = [];
  for (const e of EDITIONS) {
    const interior = buildInterior(e, bookMd);
    publishToDownloads(interior.path, e.interiorName);

    const covers = buildCovers(e);
    if (covers) publishToDownloads(covers.path, e.coversName);

    spec.push({
      key: e.key,
      label: e.label,
      trimMm: { w: e.trimW, h: e.trimH },
      up: e.up,
      pagesPerSheet: pagesPerSheet(e),
      gutterMm: e.margins.inner,
      interior: {
        file: e.interiorName,
        pages: interior.pages,
        sheets: interior.pages / pagesPerSheet(e),
        bytes: keepMeasuredBytes(
          interior.path, e.interiorName, illustrationsComplete, previous,
        ),
      },
      covers: covers
        ? {
            file: e.coversName,
            pages: covers.pages,
            bytes: keepMeasuredBytes(
              covers.path, e.coversName, illustrationsComplete, previous,
            ),
          }
        : null,
    });
  }

  writeSpec(spec);
}

main();
