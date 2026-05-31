/**
 * Turns a section's Markdown into the plain text the reader sees, then into the
 * pieces the word-level drag selection needs.
 *
 * The web anchors to an exact DOM Range. RN's markdown renderer exposes no
 * Range, so mobile recovers a selection by rendering each body word as its own
 * measurable <Text> (see selection.tsx / SelectableSection) and dragging across
 * them. We strip the same Markdown markers the renderer drops to get the
 * section's plain text, then build a W3C-style text-quote selector (`anchor` =
 * section id, `quote` = the selected words joined by spaces, `prefix`/`suffix` =
 * PAD chars of surrounding plain text). Because the quote is plain text, it
 * matches both the mobile inline renderer and the web's `findQuote`, so the mark
 * round-trips: a passage highlighted on mobile paints inline on the web, and
 * vice-versa.
 */

import { ANCHOR_PAD, type AnnotationSelector } from "./textAnchor";

/**
 * Strip Markdown to the visible plain text, mirroring what
 * react-native-markdown-display renders for leaf `text` nodes:
 *  - drop heading hashes, list bullets, blockquote markers
 *  - unwrap **bold** / *italic* / `code` / [links](url) to their label
 *  - collapse whitespace to single spaces
 * Kept deliberately simple — the suttas are plain prose with light emphasis.
 */
export function sectionPlainText(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/^\s*>\s?/gm, "") // blockquote markers
    .replace(/^\s*[-*+]\s+/gm, "") // list bullets
    .replace(/^\s*\d+\.\s+/gm, "") // ordered list markers
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → label
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // bold
    .replace(/(\*|_)(.*?)\1/g, "$2") // italic
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tokenize a leaf string into whitespace-delimited words plus the whitespace
 * runs between them, so the renderer can wrap each word in its own measurable
 * <Text> while still emitting the original spacing. Trailing punctuation snaps
 * to its word (word-level granularity). Whitespace pieces have no word index and
 * aren't selectable; only `word` pieces are.
 */
export type LeafPiece = { kind: "word"; text: string } | { kind: "space"; text: string };

export function splitLeaf(text: string): LeafPiece[] {
  const out: LeafPiece[] = [];
  const re = /(\s+)|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[1] != null) out.push({ kind: "space", text: m[1] });
    else out.push({ kind: "word", text: m[2] });
  }
  return out;
}

/**
 * Build a text-quote selector for a chosen quote within a section's plain text.
 * `anchor` is the section id; prefix/suffix are PAD chars of surrounding text so
 * the web can disambiguate repeated sentences. Falls back to empty context if
 * the quote isn't found (e.g. a whole-section snippet).
 */
export function selectorForQuote(
  anchorId: string,
  plain: string,
  quote: string,
): AnnotationSelector {
  const at = plain.indexOf(quote);
  if (at < 0) {
    return { anchor: anchorId, quote, prefix: "", suffix: "" };
  }
  return {
    anchor: anchorId,
    quote,
    prefix: plain.slice(Math.max(0, at - ANCHOR_PAD), at),
    suffix: plain.slice(at + quote.length, at + quote.length + ANCHOR_PAD),
  };
}
