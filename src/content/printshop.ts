/**
 * Typed view of printshop-spec.json — the numbers /print quotes to a copy shop.
 *
 * The JSON is written by scripts/build-printshop-pdf.ts and committed, because
 * the PDFs themselves live in gitignored public/downloads/ and can't be measured
 * at web-build time. This module is the only place that reads it, so the shape
 * of a machine-written file doesn't leak into the views.
 */

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
export const PRINTSHOP_EDITIONS = spec.editions as unknown as PrintshopEdition[];

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
