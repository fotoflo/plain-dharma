/**
 * Builds the shareable artefacts for a passage — the deep link and the
 * copy-passage text — to match the web's ShareDialog byte-for-byte so a link
 * shared from mobile opens on plaindharma.com and lands on the passage.
 *
 * Web builds: `${origin}${pathname}?h=${encodeSelector(selector)}` and a copy
 * payload of `“${quote}”\n\n${title}\n${url}`. On mobile the public reading page
 * for a sutta is `https://plaindharma.com/<slug>` (English at the root, no
 * locale prefix — same as the web today). The `?h=` payload uses the identical
 * encoder (see textAnchor.encodeSelector), so the web's `?h=` deep-link effect
 * (scroll-to + flash) resolves the mark.
 */

import { SITE_ORIGIN } from "@/lib/site";
import { encodeSelector, type AnnotationSelector } from "./textAnchor";

export interface SharePayload {
  url: string;
  quote: string;
  title: string;
  /** The full text the "Copy passage" / native-share message uses. */
  passageText: string;
}

/** Build the share payload for a mark/selector on a given sutta. */
export function buildSharePayload(
  slug: string,
  selector: AnnotationSelector,
  title: string,
): SharePayload {
  const url = `${SITE_ORIGIN}/${slug}?h=${encodeSelector(selector)}`;
  const quote = selector.quote;
  return {
    url,
    quote,
    title,
    passageText: `“${quote}”\n\n${title}\n${url}`,
  };
}
