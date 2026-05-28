/**
 * Build the Plain Dharma EPUB from MDX sources.
 *
 * Pipeline:
 *   1. Read each MDX file in canonical SUTTAS order
 *   2. Strip YAML frontmatter (the MDX files contain no JSX, just markdown)
 *   3. Assemble a single book.md with title page, colophon, PREFACE, per-sutta
 *      [drop epigraph + illustration + body], CLOSING, canonical-links appendix
 *   4. Shell out to pandoc → EPUB 3
 *
 * Output: dist/ebook/plain-dharma.epub (plus book.md, metadata.yaml, ebook.css
 *         retained as build artifacts for debugging).
 *
 * Cover (dist/ebook/cover.jpg) is attached if present; produced separately by
 * scripts/generate-cover.ts.
 *
 * Run: pnpm build-ebook
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SUTTAS } from "@plain-dharma/content";
import {
  AUTHOR,
  BOOK_SUBTITLE,
  BOOK_TITLE,
  PUBLISHER,
  SITE_URL,
  buildBookMarkdown,
  generateQrCode,
} from "./lib/book-source.js";

const __filename = fileURLToPath(import.meta.url);
const ROOT = join(dirname(__filename), "..");
const ILLUSTRATIONS_DIR = join(ROOT, "public", "illustrations");
const OUT_DIR = join(ROOT, "dist", "ebook");
const IMAGES_DIR = join(OUT_DIR, "images");

// Target width for the embedded illustrations. Kindle Paperwhite tops out at
// 1236px; illustrations display at ~70% page width, so the rendered size is
// ~860px. 800px source is sharp on Paperwhite and acceptable on Kindle Scribe.
// JPEG q=85 with the source PNG flattened onto cream (#F5EFE0) gets each
// image from ~1.3 MB down to ~50 KB. The trade vs PNG: no transparency, so
// in dark-mode readers the cream rectangle is visible behind the artwork.
// For a Kindle-primary edition that's acceptable — most reads are light-mode.
const ILLUSTRATION_TARGET_WIDTH = 800;
const ILLUSTRATION_JPEG_QUALITY = 85;
const ILLUSTRATION_BG = "#F5EFE0"; // cream — matches site --color-cream

const TODAY = new Date().toISOString().slice(0, 10);

// Resize + flatten + JPEG-compress a source illustration into dist/ebook/images/
// and return the resulting path. Cached: only regenerates if the source PNG is
// newer than the resized output. Transparency is collapsed onto cream.
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


function buildMetadataYaml(): string {
  return [
    "---",
    `title: ${JSON.stringify(BOOK_TITLE)}`,
    `subtitle: ${JSON.stringify(BOOK_SUBTITLE)}`,
    "creator:",
    "  - role: author",
    `    text: ${JSON.stringify(AUTHOR)}`,
    "contributor:",
    "  - role: cov",
    `    text: ${JSON.stringify(AUTHOR)}`,
    "  - role: cov",
    `    text: ${JSON.stringify("Ellen Shapiro")}`,
    "language: en",
    `publisher: ${JSON.stringify(PUBLISHER)}`,
    `date: ${TODAY}`,
    'rights: "CC0 1.0 — released into the public domain. https://creativecommons.org/publicdomain/zero/1.0/"',
    "description: |",
    "  Six foundational Buddhist suttas — the First Talk, Not-Self, Fire Sermon,",
    "  Loving-Kindness, Foundations of Mindfulness, and How to Decide What to Believe",
    "  — rendered in plain modern English. Reading-first. Public domain.",
    "subject:",
    "  - Buddhism",
    "  - Religion",
    "  - Spirituality",
    "  - Philosophy",
    "identifier:",
    "  - scheme: URL",
    `    text: ${SITE_URL}`,
    "---",
    "",
  ].join("\n");
}

// Modest ebook stylesheet. Most e-readers ignore or override most CSS — kept
// minimal on purpose so the reader's font preferences win.
const EBOOK_CSS = `
body { line-height: 1.55; }
h1 { page-break-before: always; margin-top: 3em; font-weight: normal; }
h2 { margin-top: 2em; font-weight: normal; }
blockquote {
  margin: 1.5em 1.5em;
  font-style: italic;
  border-left: 2px solid #888;
  padding-left: 1em;
  color: #555;
}
img { max-width: 70%; display: block; margin: 1.5em auto; }
hr { border: none; text-align: center; margin: 2em 0; }
hr::before { content: "* * *"; letter-spacing: 0.5em; color: #888; }
p { text-indent: 0; margin: 0.8em 0; }
`;

function ensureOutDir(): void {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true });
}

function runPandoc(): void {
  const bookMd = join(OUT_DIR, "book.md");
  const metadataYaml = join(OUT_DIR, "metadata.yaml");
  const cssPath = join(OUT_DIR, "ebook.css");
  const coverJpg = join(OUT_DIR, "cover.jpg");
  const outEpub = join(OUT_DIR, "plain-dharma.epub");

  const args = [
    "--from=markdown",
    "--to=epub3",
    `--output=${outEpub}`,
    `--metadata-file=${metadataYaml}`,
    `--css=${cssPath}`,
    "--toc",
    "--toc-depth=2",
    "--split-level=1",
  ];
  if (existsSync(coverJpg)) {
    args.push(`--epub-cover-image=${coverJpg}`);
  } else {
    console.warn(
      "[build-ebook] no cover.jpg found — building EPUB without cover. " +
        "Run `pnpm generate-cover` to create one."
    );
  }
  args.push(bookMd);

  execFileSync("pandoc", args, { stdio: "inherit" });
  console.log(`\n[build-ebook] wrote ${outEpub}`);
}

function main(): void {
  if (SUTTAS.length === 0) throw new Error("No suttas registered.");
  ensureOutDir();

  const qrPath = generateQrCode(SITE_URL, join(IMAGES_DIR, "qr.png"));
  const md = buildBookMarkdown({
    getIllustrationPath: prepareIllustration,
    qrCodePath: qrPath,
  });
  writeFileSync(join(OUT_DIR, "book.md"), md);
  writeFileSync(join(OUT_DIR, "metadata.yaml"), buildMetadataYaml());
  writeFileSync(join(OUT_DIR, "ebook.css"), EBOOK_CSS);

  runPandoc();
}

main();
