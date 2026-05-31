/**
 * Turns a section's Markdown into the plain text the reader sees, then into
 * pickable sentences — the data the sentence-level highlight flow needs.
 *
 * The web anchors to an exact DOM Range. RN's markdown renderer exposes no
 * Range, so mobile lets the reader pick a *sentence* (or the whole passage)
 * within a long-pressed section. We strip the same Markdown markers the renderer
 * drops, split into sentences, and build a W3C-style text-quote selector
 * (`anchor` = section id, `quote` = the sentence, `prefix`/`suffix` = PAD chars
 * of surrounding plain text). Because the quote is plain text, it matches both
 * the mobile inline renderer and the web's `findQuote`, so the mark round-trips:
 * a sentence highlighted on mobile paints inline on the web, and vice-versa.
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

const QUOTE_MAX = 180;

/** A short lead snippet for a section — used when no sentence is picked. */
export function sectionQuote(markdown: string): string {
  const text = sectionPlainText(markdown);
  return text.length > QUOTE_MAX ? `${text.slice(0, QUOTE_MAX).trimEnd()}…` : text;
}

/** Split plain text into sentences for the picker (keeps terminal punctuation). */
export function splitSentences(plain: string): string[] {
  if (!plain) return [];
  // Split after . ! ? (optionally followed by a closing quote) then trim.
  const parts = plain.match(/[^.!?]+[.!?]+["'”’)]*\s*|[^.!?]+$/g) ?? [plain];
  return parts.map((s) => s.trim()).filter(Boolean);
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
