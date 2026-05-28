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
export const BOOK_SUBTITLE =
  "Six Foundational Buddhist Teachings in Plain Modern English";
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
  parts.push(`*Cover design by ${AUTHOR} and Ellen Shapiro.*\n`);

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

  if (opts.qrCodePath) {
    parts.push(`# Read it Online {.unnumbered}\n`);
    parts.push(
      `Every format of this book lives at **[plaindharma.com](${SITE_URL})** — all free under CC0.\n`
    );
    parts.push(`![](${opts.qrCodePath})\n`);
    parts.push(
      `- Read it in the browser\n- Download the PDF or EPUB\n- **Listen to the narrated audiobook** — a 38-minute reading of all six teachings\n- Print booklets for free distribution at temples and retreats\n`
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
