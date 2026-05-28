/**
 * W3C-style text-quote anchoring for margin notes.
 *
 * A selector pins a passage by its exact text plus a little surrounding
 * context, scoped to a section id. It survives DOM re-renders and survives
 * other marks wrapping nearby text — injected <mark> elements add no
 * characters, so offsets into the section's text content stay stable.
 *
 * Everything here is browser-only (uses Range / TreeWalker); call from effects.
 * Ported from the Zeph report annotation layer.
 */

export interface AnnotationSelector {
  anchor: string; // id of the nearest ancestor section, or 'doc'
  quote: string;
  prefix: string;
  suffix: string;
}

const PAD = 48; // chars of context captured either side of the quote

interface FlatNode {
  node: Text;
  start: number;
  end: number;
}
interface Flat {
  text: string;
  nodes: FlatNode[];
}

/** Flatten a subtree into its concatenated text + a node/offset map. */
function flatten(root: HTMLElement): Flat {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: FlatNode[] = [];
  let text = "";
  let cur: Node | null;
  while ((cur = walker.nextNode())) {
    const t = cur as Text;
    const start = text.length;
    text += t.data;
    nodes.push({ node: t, start, end: text.length });
  }
  return { text, nodes };
}

/** Absolute character offset of (container, offset) within `root`'s text. */
function absOffset(root: HTMLElement, container: Node, offset: number): number {
  const r = document.createRange();
  r.selectNodeContents(root);
  try {
    r.setEnd(container, offset);
  } catch {
    return 0;
  }
  return r.toString().length;
}

/** Map an absolute offset back to a (Text node, offset) position. */
function locate(flat: Flat, off: number, atEnd: boolean): { node: Text; offset: number } | null {
  for (const fn of flat.nodes) {
    const hit = atEnd ? off > fn.start && off <= fn.end : off >= fn.start && off < fn.end;
    if (hit) return { node: fn.node, offset: off - fn.start };
  }
  const first = flat.nodes[0];
  const last = flat.nodes[flat.nodes.length - 1];
  if (first && off <= first.start) return { node: first.node, offset: 0 };
  if (last && off >= last.end) return { node: last.node, offset: last.node.data.length };
  return null;
}

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

/** The element a selection should anchor to, plus its id ('doc' if none). */
function resolveAnchor(node: Node, scope: HTMLElement): { root: HTMLElement; anchor: string } {
  const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);
  const withId = el?.closest("[id]") as HTMLElement | null;
  if (withId && scope.contains(withId)) return { root: withId, anchor: withId.id };
  return { root: scope, anchor: "doc" };
}

/** Build a selector from a live Range. Returns null for an unusable selection. */
export function selectorFromRange(range: Range, scope: HTMLElement): AnnotationSelector | null {
  if (range.collapsed) return null;
  const { root, anchor } = resolveAnchor(range.startContainer, scope);
  const flat = flatten(root);
  if (!flat.text) return null;

  const start = absOffset(root, range.startContainer, range.startOffset);
  const end = absOffset(root, range.endContainer, range.endOffset);
  if (end <= start) return null;

  const quote = flat.text.slice(start, end);
  if (!quote.trim()) return null;

  return {
    anchor,
    quote,
    prefix: flat.text.slice(Math.max(0, start - PAD), start),
    suffix: flat.text.slice(end, end + PAD),
  };
}

/** Find where a selector's quote sits in `text`. -1 if it has gone missing. */
function findQuote(text: string, sel: AnnotationSelector): number {
  if (sel.prefix || sel.suffix) {
    const exact = text.indexOf(sel.prefix + sel.quote + sel.suffix);
    if (exact >= 0) return exact + sel.prefix.length;
  }
  const hits: number[] = [];
  let from = 0;
  let idx: number;
  while ((idx = text.indexOf(sel.quote, from)) >= 0) {
    hits.push(idx);
    from = idx + 1;
  }
  if (hits.length === 0) return -1;
  if (hits.length === 1) return hits[0];

  // Ambiguous — pick the occurrence whose context best matches.
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
  return best;
}

/** Resolve a stored selector to a live Range, or null if the passage is gone. */
export function rangeFromSelector(sel: AnnotationSelector, scope: HTMLElement): Range | null {
  let root: HTMLElement = scope;
  if (sel.anchor && sel.anchor !== "doc") {
    const found = document.getElementById(sel.anchor);
    if (found && scope.contains(found)) root = found;
  }
  const flat = flatten(root);
  if (!flat.text) return null;

  const qStart = findQuote(flat.text, sel);
  if (qStart < 0) return null;
  const qEnd = qStart + sel.quote.length;

  const a = locate(flat, qStart, false);
  const b = locate(flat, qEnd, true);
  if (!a || !b) return null;

  const range = document.createRange();
  try {
    range.setStart(a.node, a.offset);
    range.setEnd(b.node, b.offset);
  } catch {
    return null;
  }
  return range;
}

/**
 * Wrap a Range in <mark> elements — one per text-node segment it crosses, so
 * a passage spanning <strong>/<em> still highlights cleanly. Returns the marks.
 */
export function wrapRange(
  range: Range,
  className: string,
  dataset: Record<string, string>,
): HTMLElement[] {
  const container =
    range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement
      : (range.commonAncestorContainer as HTMLElement);
  if (!container) return [];

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const segs: Array<{ node: Text; from: number; to: number }> = [];
  let cur: Node | null;
  while ((cur = walker.nextNode())) {
    const tn = cur as Text;
    if (!range.intersectsNode(tn)) continue;
    const from = tn === range.startContainer ? range.startOffset : 0;
    const to = tn === range.endContainer ? range.endOffset : tn.data.length;
    if (to > from) segs.push({ node: tn, from, to });
  }

  // Each segment is its own text node — wrapping one never disturbs another.
  const marks: HTMLElement[] = [];
  for (const seg of segs) {
    const sub = document.createRange();
    sub.setStart(seg.node, seg.from);
    sub.setEnd(seg.node, seg.to);
    const mark = document.createElement("mark");
    mark.className = className;
    for (const [k, v] of Object.entries(dataset)) mark.dataset[k] = v;
    try {
      sub.surroundContents(mark);
      marks.push(mark);
    } catch {
      /* skip a segment that won't wrap cleanly */
    }
  }
  return marks;
}

/** Remove every <mark> for a mark id, healing the split text nodes. */
export function unwrapMark(id: string): void {
  document.querySelectorAll(`mark[data-mark-id="${CSS.escape(id)}"]`).forEach((m) => {
    const parent = m.parentNode;
    if (!parent) return;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
    parent.normalize();
  });
}

/** Encode a selector for a shareable deep link (`?h=`). */
export function encodeSelector(sel: AnnotationSelector): string {
  const json = JSON.stringify({ a: sel.anchor, q: sel.quote, p: sel.prefix, s: sel.suffix });
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Decode a `?h=` deep-link payload back into a selector. */
export function decodeSelector(encoded: string): AnnotationSelector | null {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(escape(atob(b64)));
    const o = JSON.parse(json) as { a?: string; q?: string; p?: string; s?: string };
    if (!o.q) return null;
    return { anchor: o.a || "doc", quote: o.q, prefix: o.p || "", suffix: o.s || "" };
  } catch {
    return null;
  }
}
