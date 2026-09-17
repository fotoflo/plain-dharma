/**
 * Typed view of printshop-spec.json — the numbers /print quotes to a copy shop.
 *
 * The JSON is written by scripts/build-printshop-pdf.ts and committed, because
 * the PDFs themselves live in gitignored public/downloads/ and can't be measured
 * at web-build time. This module is the only place that reads it, so the shape
 * of a machine-written file doesn't leak into the views.
 */

import { hasAsset } from "@plain-dharma/content/assets";

import spec from "./printshop-spec.json";

/** The print-shop trims, in the order /print offers them. */
export type EditionKey = "a5" | "a6";

export type PrintshopFile = {
  file: string;
  pages: number;
  /**
   * Byte size, or null when the build that wrote this had no honest measurement
   * to give (illustrations missing, or stand-ins used to reproduce pagination
   * offline). Callers must hide the size rather than print a zero — see
   * sizesAreMeaningless() in the build script.
   */
  bytes: number | null;
};

export type PrintshopEdition = {
  key: EditionKey;
  /** "A5" / "A6" — a paper size, the same in every language. */
  label: string;
  trimMm: { w: number; h: number };
  /** Pages per A4 side. Duplex doubles it into pagesPerSheet. */
  up: number;
  pagesPerSheet: number;
  /** Inner (binding) margin in mm, quoted on the spec sheet. */
  gutterMm: number;
  interior: PrintshopFile & { sheets: number };
  covers: PrintshopFile | null;
};

/**
 * The cast is the seam between a generated file and typed code: TypeScript
 * infers a union of two differently-shaped object literals from the JSON (one
 * edition may carry `covers: null`), which is narrower than it looks and not
 * worth fighting. The build script owns this shape; PrintshopEdition mirrors it.
 */
const ALL_EDITIONS = spec.editions as unknown as PrintshopEdition[];

/**
 * The editions /print may actually offer: the ones whose PDFs are on the CDN.
 *
 * printshop-spec.json is committed and the PDFs are not — they're built locally
 * and pushed to the bucket by `pnpm upload-assets`, which is a separate step
 * from shipping the code that links to them. So the spec runs ahead of reality
 * between "the build script learned about a new size" and "that size's files
 * exist", and in that window a download card would be a 404 dressed up as an
 * offer. The version map is the record of what was uploaded, so ask it.
 *
 * The same check covers the cover sheet on its own: an interior can be up while
 * its covers aren't, and half an edition is still worth offering.
 *
 * A new size therefore needs no second deploy. It appears on the page the moment
 * its files land in the bucket and the version map that names them is committed.
 */
function published(path: string): boolean {
  return hasAsset(`downloads/${path}`);
}

const LIVE_EDITIONS: PrintshopEdition[] = ALL_EDITIONS.filter((e) =>
  published(e.interior.file),
).map((e) => ({
  ...e,
  covers: e.covers && published(e.covers.file) ? e.covers : null,
}));

/**
 * Fall back to the unfiltered list when nothing looks published, matching the
 * rule assets.ts already follows: an empty version map means nobody has uploaded
 * yet (a fresh clone, a first run), not that the book has no editions. Blanking
 * the page in that case would be a worse failure than an optimistic link.
 */
export const PRINTSHOP_EDITIONS: PrintshopEdition[] = LIVE_EDITIONS.length
  ? LIVE_EDITIONS
  : ALL_EDITIONS;

/** The size /print opens on, and the one the download page describes. */
export const DEFAULT_EDITION: PrintshopEdition = PRINTSHOP_EDITIONS[0];

/**
 * Placeholder values for one edition's spec-sheet copy. Everything the shop
 * needs to be told that varies by trim — see SPEC in print-strings.ts, and
 * format() in PrintSpecSheet.tsx for how they're substituted.
 */
export type EditionVars = {
  size: string;
  trim: string;
  pages: number;
  sheets: number;
  up: number;
  perSheet: number;
  gutter: number;
};

export function editionVars(e: PrintshopEdition): EditionVars {
  return {
    size: e.label,
    trim: `${e.trimMm.w} × ${e.trimMm.h} mm`,
    pages: e.interior.pages,
    sheets: e.interior.sheets,
    up: e.up,
    perSheet: e.pagesPerSheet,
    gutter: e.gutterMm,
  };
}
