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
export const AUTHOR = "Alex Miller";
export const PUBLISHER = "Plain Dharma";
export const SITE_URL = "https://plaindharma.com";

function stripFrontmatter(src: string): string {
  return src.replace(/^---\n[\s\S]*?\n---\n+/, "");
}

function readSuttaBody(slug: string): string {
  const raw = readFileSync(join(CONTENT_DIR, `${slug}.mdx`), "utf8");
  return stripFrontmatter(raw).trim();
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
    `*${BOOK_SUBTITLE}.*\n\nSix teachings of the Buddha, rendered in plain modern English by ${AUTHOR}. Not a scholarly translation — a plain reading, meant to make the foundational suttas accessible to a first-time reader without sacrificing the substance.\n\nFor canonical translations, see *Sources & Further Reading* at the end of this volume, or visit any of: [SuttaCentral](https://suttacentral.net), [Access to Insight](https://www.accesstoinsight.org), or the published work of Bhikkhu Bodhi.\n`
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
    if (illustration) parts.push(`![](${illustration})\n`);

    parts.push(`${readSuttaBody(meta.slug)}\n`);
  }

  parts.push(`# Closing {.unnumbered}\n`);
  parts.push(`${CLOSING[DEFAULT_LOCALE]}\n`);

  parts.push(`# How This Book Was Made {.unnumbered}\n`);
  parts.push(
    `There's an irony here we'd rather name than hide. These teachings are about what it is to be human — to suffer and pay attention, to let go, to be kind — and yet this edition leaned heavily on machines to make.\n`
  );
  parts.push(
    `The translation was first drafted from the original Pali by Claude, an AI language model. The illustrations were generated by Google's Gemini. The audiobook was first voiced by ElevenLabs. None of it was left as the machine made it: the translation was argued out by hand, line by line, word by word, against the 2,600-year-old Pali; the narration edited for pacing and breath; the artwork recolored and partially reworked.\n`
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
    `Each of these six teachings is preserved in the Pali Canon. The references and translations below are the rigorous scholarly sources behind this plain-English rendering. If a teaching here moves you, the next step is to read the same passage as translated by a working scholar.\n`
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
