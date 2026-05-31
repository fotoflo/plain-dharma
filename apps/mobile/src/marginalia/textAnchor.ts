/**
 * Text-quote anchoring helpers for mobile Margin Notes.
 *
 * Ported from the web's `src/components/marginalia/textAnchor.ts`, keeping the
 * two pieces that have to round-trip across platforms:
 *
 *  1. `encodeSelector` / `decodeSelector` — the `?h=` deep-link payload. A mark
 *     shared from mobile must open on plaindharma.com, so the encoding is
 *     byte-identical to the web's: standard base64 of the UTF-8 JSON
 *     `{a,q,p,s}`, then URL-safe (`+`→`-`, `/`→`_`, strip `=`). React Native has
 *     no `btoa`/`atob`, so we implement UTF-8 + base64 by hand rather than pull a
 *     polyfill.
 *  2. `findQuote` — locates a stored selector's `quote` inside a block of plain
 *     text (prefix/suffix disambiguation included), used to paint inline
 *     highlights in the reader. This is the text-only half of the web's
 *     `rangeFromSelector`; RN has no DOM Range, so we resolve to a character
 *     range and let the renderer split the string around it.
 */

export interface AnnotationSelector {
  anchor: string; // id of the nearest ancestor section, or 'doc'
  quote: string;
  prefix: string;
  suffix: string;
}

/** Chars of context captured either side of the quote (matches the web's PAD). */
export const ANCHOR_PAD = 48;

/* ── base64url over UTF-8, no btoa/atob ─────────────────────────────────────── */

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function utf8Bytes(str: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
      const next = str.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
        i++;
      }
    }
    if (code < 0x80) {
      out.push(code);
    } else if (code < 0x800) {
      out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      out.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return out;
}

function bytesToUtf8(bytes: number[]): string {
  let out = "";
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i++];
    if (b < 0x80) {
      out += String.fromCharCode(b);
    } else if (b < 0xe0) {
      out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i++] & 0x3f));
    } else if (b < 0xf0) {
      out += String.fromCharCode(
        ((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f),
      );
    } else {
      let cp =
        ((b & 0x07) << 18) |
        ((bytes[i++] & 0x3f) << 12) |
        ((bytes[i++] & 0x3f) << 6) |
        (bytes[i++] & 0x3f);
      cp -= 0x10000;
      out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
    }
  }
  return out;
}

function base64Encode(bytes: number[]): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    const has1 = b1 !== undefined;
    const has2 = b2 !== undefined;
    out += B64[b0 >> 2];
    out += B64[((b0 & 0x03) << 4) | (has1 ? b1 >> 4 : 0)];
    out += has1 ? B64[((b1 & 0x0f) << 2) | (has2 ? b2 >> 6 : 0)] : "=";
    out += has2 ? B64[b2 & 0x3f] : "=";
  }
  return out;
}

function base64Decode(b64: string): number[] {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, "");
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = B64.indexOf(clean[i]);
    const c1 = B64.indexOf(clean[i + 1]);
    const c2 = clean[i + 2] ? B64.indexOf(clean[i + 2]) : -1;
    const c3 = clean[i + 3] ? B64.indexOf(clean[i + 3]) : -1;
    out.push((c0 << 2) | (c1 >> 4));
    if (c2 >= 0) out.push(((c1 & 0x0f) << 4) | (c2 >> 2));
    if (c3 >= 0) out.push(((c2 & 0x03) << 6) | c3);
  }
  return out;
}

/** Encode a selector for a shareable deep link (`?h=`). Matches web byte-for-byte. */
export function encodeSelector(sel: AnnotationSelector): string {
  const json = JSON.stringify({ a: sel.anchor, q: sel.quote, p: sel.prefix, s: sel.suffix });
  return base64Encode(utf8Bytes(json))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Decode a `?h=` deep-link payload back into a selector. */
export function decodeSelector(encoded: string): AnnotationSelector | null {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const json = bytesToUtf8(base64Decode(b64));
    const o = JSON.parse(json) as { a?: string; q?: string; p?: string; s?: string };
    if (!o.q) return null;
    return { anchor: o.a || "doc", quote: o.q, prefix: o.p || "", suffix: o.s || "" };
  } catch {
    return null;
  }
}

/* ── quote location (text-only port of the web's findQuote) ─────────────────── */

function commonSuffixLen(a: string, b: string): number {
  let n = 0;
  while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++;
  return n;
}
function commonPrefixLen(a: string, b: string): number {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

/**
 * Find where a selector's quote sits in `text`. Returns the [start, end)
 * character offsets, or null if the passage has gone missing. Mirrors the web's
 * private `findQuote`: prefers an exact prefix+quote+suffix match, then a unique
 * occurrence, then the occurrence whose surrounding context best matches.
 */
export function findQuote(
  text: string,
  sel: Pick<AnnotationSelector, "quote" | "prefix" | "suffix">,
): { start: number; end: number } | null {
  if (!sel.quote) return null;

  let start = -1;
  if (sel.prefix || sel.suffix) {
    const exact = text.indexOf(sel.prefix + sel.quote + sel.suffix);
    if (exact >= 0) start = exact + sel.prefix.length;
  }

  if (start < 0) {
    const hits: number[] = [];
    let from = 0;
    let idx: number;
    while ((idx = text.indexOf(sel.quote, from)) >= 0) {
      hits.push(idx);
      from = idx + 1;
    }
    if (hits.length === 0) return null;
    if (hits.length === 1) {
      start = hits[0];
    } else {
      let best = hits[0];
      let bestScore = -1;
      for (const o of hits) {
        const before = text.slice(Math.max(0, o - sel.prefix.length), o);
        const after = text.slice(o + sel.quote.length, o + sel.quote.length + sel.suffix.length);
        const score = commonSuffixLen(before, sel.prefix) + commonPrefixLen(after, sel.suffix);
        if (score > bestScore) {
          bestScore = score;
          best = o;
        }
      }
      start = best;
    }
  }

  return { start, end: start + sel.quote.length };
}
