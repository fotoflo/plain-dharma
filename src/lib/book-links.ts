// Single source of truth for the editions of the book sold on Amazon.
//
// We don't sell anything — Amazon does, at its own price; every format on
// this site stays free (CC0). These are informational pointers only.

export const BOOK_LINKS = {
  /**
   * The 6×9 paperback (KDP Print). ISBN-10 1891328387 / ISBN-13
   * 978-1-891328-38-1 — the ISBN-10 doubles as the Amazon ASIN, so this is
   * the stable canonical product URL.
   */
  amazonPaperback: "https://www.amazon.com/dp/1891328387",
  /**
   * The Kindle ebook (ASIN B0H4W4TVGM, linked from the paperback listing's
   * format swatch). Mirrors apps/mobile/src/lib/links.ts `AMAZON_KINDLE_URL`.
   */
  amazonKindle: "https://www.amazon.com/dp/B0H4W4TVGM",
} as const;

/** ISBN-13 of the paperback, for structured data. */
export const PAPERBACK_ISBN = "9781891328381";
