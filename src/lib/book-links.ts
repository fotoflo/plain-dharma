// Single source of truth for the editions of the book sold on Amazon.
//
// We don't sell anything — Amazon does, at its own price; every format on
// this site stays free (CC0). These are informational pointers only.
//
// Visible links carry the Amazon Associates tag (the footer carries the
// required disclosure); structured data uses the untagged canonical URLs.

/** Amazon Associates tracking id. */
const AMAZON_TAG = "plaindharma-20";

/**
 * Untagged canonical product URLs — used in structured data, where an
 * affiliate parameter doesn't belong. The paperback's ISBN-10 (1891328387,
 * ISBN-13 978-1-891328-38-1) doubles as its ASIN; the Kindle edition is
 * ASIN B0H4W4TVGM (from the paperback listing's format swatch).
 */
export const BOOK_LINKS_CANONICAL = {
  amazonPaperback: "https://www.amazon.com/dp/1891328387",
  amazonKindle: "https://www.amazon.com/dp/B0H4W4TVGM",
} as const;

/** Tagged links for visible CTAs. Mirrors apps/mobile/src/lib/links.ts. */
export const BOOK_LINKS = {
  amazonPaperback: `${BOOK_LINKS_CANONICAL.amazonPaperback}?tag=${AMAZON_TAG}`,
  amazonKindle: `${BOOK_LINKS_CANONICAL.amazonKindle}?tag=${AMAZON_TAG}`,
} as const;

/** ISBN-13 of the paperback, for structured data. */
export const PAPERBACK_ISBN = "9781891328381";
