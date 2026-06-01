/**
 * Turns a section's Markdown into the plain text the reader sees, then into a
 * W3C-style text-quote selector for a chosen quote.
 *
 * The web anchors to an exact DOM Range. On mobile the native UITextView
 * selection (see SelectableSection / MarkdownRenderer) hands back the selected
 * text; we strip the same Markdown markers the renderer drops to get the
 * section's plain text, then build a selector (`anchor` = section id, `quote` =
 * the selected text, `prefix`/`suffix` = PAD chars of surrounding plain text).
 * Because the quote is plain text, it matches both the mobile inline renderer
 * and the web's `findQuote`, so the mark round-trips: a passage highlighted on
 * mobile paints inline on the web, and vice-versa.
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
