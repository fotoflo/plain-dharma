/**
 * Shared book assembly used by both the EPUB and PDF builders.
 *
 * The structure is the same across both outputs: title/colophon → preface →
 * six suttas (each with drop epigraph, illustration, body) → closing → sources
 * appendix. What differs between EPUB and PDF is image preparation (different
 * sizes, formats, transparency), so the caller passes a `getIllustrationPath`
 * function that returns whatever flavor of image they want embedded.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { getSuttasInOrder, DEFAULT_LOCALE } from "@plain-dharma/content";
import { DROPS, PREFACE, CLOSING } from "@plain-dharma/content/drops";
import { CANONICAL_LINKS } from "@plain-dharma/content/canonical-links";

const SUTTAS_IN_ORDER = getSuttasInOrder(DEFAULT_LOCALE);

const __filename = fileURLToPath(import.meta.url);
const ROOT = join(dirname(__filename), "..", "..");
// Canonical MDX lives in the shared @plain-dharma/content package.
const CONTENT_DIR = join(ROOT, "packages", "content", "en");

export const BOOK_TITLE = "Plain Dharma";
// Matches the title page / cover (scripts/assets/PlainDharma_Cover.pdf).
export const BOOK_SUBTITLE =
  "The Buddha’s Foundational Teachings in Modern English";
// The book is credited to the Buddha (author), translated by Claude Opus, and
// edited by Alex Miller. AUTHOR is the human — used for the editor credit and
// the cover-design credit. Keep these three distinct: many metadata fields force
// a single "creator" (= ORIGINAL_AUTHOR) with translator/editor as contributors.
export const AUTHOR = "Alex Miller";
export const ORIGINAL_AUTHOR = "Gautama Buddha";
export const TRANSLATOR = "Claude Opus";
export const EDITOR = AUTHOR;
/** The book-wide byline, used verbatim wherever a one-line credit is shown. */
export const BYLINE = `Translated by ${TRANSLATOR}, edited by ${EDITOR}`;
// Bowker imprint of record for ISBN 978-1-891328-37-4 (see
// docs/publishing/BOWKER_REVIEW.md). KDP's Publisher field + the EPUB's
// dc:publisher should match this exactly.
export const PUBLISHER = "Plain Dharma Press";
export const SITE_URL = "https://plaindharma.com";

// Descriptive alt text for each sutta's line-drawing illustration, so the EPUB's
// images are accessible to screen-reader users (and we can honestly answer KDP's
// "all informative images include alternative text"). Descriptions mirror what
// each drawing depicts — see the prompts in scripts/generate-illustrations.ts.
// Requires implicit_figures to be OFF in the pandoc call (build-ebook.ts), or
// the alt text would print as a visible caption.
const ILLUSTRATION_ALT: Record<string, string> = {
  "first-talk":
    "A sun rising over a low horizon, drawn as one continuous ink line, with a few tiny deer at the edge of the park.",
  "not-self":
    "A human head and shoulders in profile, its outline dissolving and lifting away like leaves on the wind.",
  "fire-sermon": "A single tall flame, drawn as one flowing, calligraphic ink line.",
  "loving-kindness":
    "A parent cradling a child, both drawn in one continuous, tender line.",
  mindfulness: "A single open eye, clear and calm, drawn as one continuous ink line.",
  "how-to-decide":
    "A pair of balance scales, slightly tilted, drawn as one continuous ink line over a soft saffron wash.",
};

function stripFrontmatter(src: string): string {
  return src.replace(/^---\n[\s\S]*?\n---\n+/, "");
}

// Remove audio-only pause cues ({/* pause */} / {/* pause:1.5 */}) so they don't
// print in the book. They're authored in the canonical MDX as MDX comments
// (invisible on the web) and converted to <break> tags for the narration.
function stripPauseMarkers(src: string): string {
  // Match horizontal whitespace around the marker but NOT newlines — otherwise
  // removing a trailing/leading marker collapses list items and paragraphs onto
  // one line.
  return src.replace(
    /[^\S\r\n]*\{\/\*\s*pause(?::\s*[\d.]+)?\s*\*\/\}[^\S\r\n]*/gi,
    " "
  );
}

function readSuttaBody(slug: string): string {
  const raw = readFileSync(join(CONTENT_DIR, `${slug}.mdx`), "utf8");
  return stripPauseMarkers(stripFrontmatter(raw)).trim();
}

export type BookSourceOptions = {
  /** Returns an absolute path (or null to skip) for the given sutta slug. */
  getIllustrationPath: (slug: string) => string | null;
  /** Optional QR code image path to embed at the end of the book. */
  qrCodePath?: string | null;
};

/**
 * Generate a PNG QR code at `outPath` pointing to `url`. Uses qrencode
 * (`brew install qrencode`). Cached: no-op if outPath already exists.
 * Returns the path or null if qrencode isn't available.
 */
export function generateQrCode(url: string, outPath: string): string | null {
  if (existsSync(outPath)) return outPath;
  const dir = dirname(outPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  try {
    execFileSync(
      "qrencode",
      [
        "-o", outPath,
        // PNG32 (RGBA 8-bit) rather than the default 1-bit indexed PNG.
        // xelatex's xdvipdfmx mishandled the 1-bit format and rendered the
        // modules as outlines instead of filled squares.
        "-t", "PNG32",
        "-s", "12",      // 12px per module — sharp on print, crisp on e-readers
        "-m", "2",       // 2-module quiet zone (the white border)
        "-l", "M",       // medium error correction — survives blur/print loss
        url,
      ],
      { stdio: "inherit" }
    );
    return outPath;
  } catch {
    console.warn(`[book-source] qrencode failed for ${url} — skipping QR.`);
    return null;
  }
}

export function buildBookMarkdown(opts: BookSourceOptions): string {
  const parts: string[] = [];

  parts.push(`# About This Book {.unnumbered}\n`);
  parts.push(
    `*${BOOK_SUBTITLE}.*\n\nSix teachings of the Buddha, translated from the original Pāli by ${TRANSLATOR} and edited line by line by ${EDITOR}. Not a scholarly translation — a plain reading, meant to make the foundational suttas accessible to a first-time reader without sacrificing the substance.\n\nFor canonical translations, see *Sources & Further Reading* at the end of this volume, or visit any of: [SuttaCentral](https://suttacentral.net), [Access to Insight](https://www.accesstoinsight.org), or the published work of Bhikkhu Bodhi.\n`
  );
  parts.push(
    `## License\n\nReleased into the public domain under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Copy it, print it, translate it, distribute it, modify it. No permission needed; no attribution required.\n\nThis is in keeping with the Buddhist tradition of free dharma distribution.\n`
  );
  parts.push(`Source text and revisions: <${SITE_URL}>\n`);

  parts.push(`# Preface {.unnumbered}\n`);
  parts.push(`${PREFACE[DEFAULT_LOCALE]}\n`);

  for (const meta of SUTTAS_IN_ORDER) {
    parts.push(`# ${meta.ordinal}. ${meta.title}\n`);
    parts.push(`*${meta.pali_name}*\n`);
    parts.push(`> ${DROPS[DEFAULT_LOCALE][meta.slug]}\n`);

    const illustration = opts.getIllustrationPath(meta.slug);
    if (illustration) {
      const alt = ILLUSTRATION_ALT[meta.slug] ?? meta.title;
      parts.push(`![${alt}](${illustration})\n`);
    }

    parts.push(`${readSuttaBody(meta.slug)}\n`);
  }

  parts.push(`# Closing {.unnumbered}\n`);
  parts.push(`${CLOSING[DEFAULT_LOCALE]}\n`);

  parts.push(`# How This Book Was Made {.unnumbered}\n`);
  parts.push(
    `There's an irony here we'd rather name than hide. These teachings are about what it is to be human — to suffer and pay attention, to let go, to be kind — and yet this edition leaned heavily on machines to make.\n`
  );
  parts.push(
    `The translation was first drafted from the original Pāli by Claude Opus, an AI language model. The illustrations were generated by Google's Gemini. The audiobook was first voiced by ElevenLabs. None of it was left as the machine made it: the translation was argued out by hand, line by line, word by word, against the 2,600-year-old Pāli; the narration edited for pacing and breath; the artwork recolored and partially reworked.\n`
  );
  parts.push(
    `Getting these teachings out to fellow humans was the first goal, and these tools made that possible — quickly, and within the reach of one person. Making the work more human is the next goal, and for that we'd like your help.\n`
  );
  parts.push(
    `We welcome handmade contributions: new artwork, a human reading, a fresh translation, corrections, or source materials of any kind. Write to **contribute@plaindharma.com**, open a pull request at [github.com/fotoflo/plain-dharma](https://github.com/fotoflo/plain-dharma), or see [plaindharma.com/contribute](${SITE_URL}/contribute). Appropriate contributions will be gathered and made freely available on the site. Everything here is in the public domain, and everything you add can be too.\n`
  );
  parts.push(`*Cover design by ${AUTHOR} and Ellen Shapiro.*\n`);

  if (opts.qrCodePath) {
    parts.push(`# Read it Online {.unnumbered}\n`);
    parts.push(
      `Every format of this book lives at **[plaindharma.com](${SITE_URL})** — all free under CC0.\n`
    );
    parts.push(`![](${opts.qrCodePath})\n`);
    parts.push(
      `- Read it in the browser\n- Download the PDF or EPUB\n- **Listen to the narrated audiobook** — about 38 minutes, free from the site or on Amazon and Audible\n- Get the **paperback** or **ebook**, for reading or for giving away\n- Print booklets for free distribution at temples and retreats\n`
    );
    parts.push(
      `Updates and corrections, when they happen, go up there first.\n`
    );
    parts.push(
      `*Released under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Copy it, print it, translate it, distribute it — no permission needed.*\n`
    );
  }

  parts.push(`# Sources & Further Reading {.unnumbered}\n`);
  parts.push(
    `Each of these six teachings is preserved in the Pāli Canon. The references and translations below are the rigorous scholarly sources behind this plain-English rendering. If a teaching here moves you, the next step is to read the same passage as translated by a working scholar.\n`
  );
  for (const meta of SUTTAS_IN_ORDER) {
    const entry = CANONICAL_LINKS[meta.slug];
    parts.push(`## ${meta.ordinal}. ${meta.title}\n`);
    parts.push(`*${entry.paliName}* — ${entry.paliReference}\n`);
    const bullets = entry.linksByLocale[DEFAULT_LOCALE]
      .map((l) => `- [${l.label}](${l.url})`)
      .join("\n");
    parts.push(`${bullets}\n`);
  }

  return parts.join("\n");
}
