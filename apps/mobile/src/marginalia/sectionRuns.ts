/**
 * Flatten a section's Markdown into a single sequence of styled inline "runs"
 * plus the exact plain-text string they render to.
 *
 * This powers cross-paragraph native selection: the reader renders a whole
 * section as ONE react-native-uitextview, and iOS selection only spans within a
 * single text view. A UITextView draws one attributed string — it has no
 * block-level layout — so block structure is faked into the text:
 *
 *   - paragraph / heading  → its inline runs, then a blank line ("\n\n")
 *   - heading              → bold run (kept inline; no block margin on iOS)
 *   - ordered list item    → "N. " marker + inline runs + "\n"
 *   - bullet list item     → "•  " marker + inline runs + "\n"
 *   - blockquote           → italic inline runs + "\n\n"
 *   - thematic break (hr)  → a short rule line
 *
 * The concatenation of every run's `text` (in order) equals `plainText`, so a
 * native selection's {start,end} UTF-16 offsets slice straight back to the
 * selected quote. Inline emphasis (bold/italic/links) is preserved as run
 * styles. Lists/blockquotes lose their indent/▎bar (the documented tradeoff for
 * cross-paragraph selection); prose is unaffected.
 */

import { MarkdownIt } from "react-native-markdown-display";

export type RunStyle =
  | "normal"
  | "bold"
  | "italic"
  | "link"
  | "heading"
  | "marker"
  // Title-block styles — only produced by SelectableTitle, never by
  // sectionToRuns; the body renderer's runStyle ignores them.
  | "kicker"
  | "h1"
  | "subtitle";

/** One inline run: a slice of text with a single style. */
export interface Run {
  text: string;
  style: RunStyle;
}

export interface SectionRuns {
  runs: Run[];
  /** Exactly the runs joined — the string native selection offsets index into. */
  plainText: string;
}

// One shared parser (typographer on, matching the reader's <Markdown>).
const md = MarkdownIt({ typographer: true });

/** A markdown-it inline child token (text / strong / em / link / breaks). */
interface InlineToken {
  type: string;
  content: string;
  children?: InlineToken[] | null;
}

/** Walk an inline token's children into styled runs under a base style. */
function inlineRuns(token: InlineToken, base: RunStyle, out: Run[]): void {
  const kids = token.children;
  if (!kids || kids.length === 0) {
    if (token.content) out.push({ text: token.content, style: base });
    return;
  }
  // markdown-it inline emphasis is a flat open/close stream, not nested — track
  // a small style stack so text between strong_open/strong_close is bold, etc.
  const stack: RunStyle[] = [base];
  const top = () => stack[stack.length - 1];
  for (const t of kids) {
    switch (t.type) {
      case "strong_open":
        stack.push("bold");
        break;
      case "em_open":
        stack.push("italic");
        break;
      case "link_open":
        stack.push("link");
        break;
      case "strong_close":
      case "em_close":
      case "link_close":
        if (stack.length > 1) stack.pop();
        break;
      case "softbreak":
      case "hardbreak":
        out.push({ text: "\n", style: top() });
        break;
      case "text":
      case "code_inline":
        if (t.content) out.push({ text: t.content, style: top() });
        break;
      default:
        if (t.content) out.push({ text: t.content, style: top() });
    }
  }
}

interface BlockToken {
  type: string;
  tag: string;
  nesting: number;
  content: string;
  markup: string;
  children?: InlineToken[] | null;
}

/**
 * Parse one section's markdown into flattened runs + the plain text. List
 * numbering is tracked per open ordered list; blank lines separate top-level
 * blocks (but not items within a list).
 */
export function sectionToRuns(markdown: string): SectionRuns {
  const tokens = md.parse(markdown, {}) as BlockToken[];
  const runs: Run[] = [];

  // Per-depth ordered-list counters; bullet lists push 0 (unused).
  const listCounters: number[] = [];
  let inListItem = false;
  let inBlockquote = 0;

  const pushSep = (sep: string) => {
    if (runs.length === 0) return; // no leading blank line
    runs.push({ text: sep, style: "normal" });
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    switch (t.type) {
      case "heading_open": {
        pushSep("\n\n");
        const inline = tokens[i + 1];
        if (inline?.type === "inline") inlineRuns(inline, "heading", runs);
        i += 2; // skip inline + heading_close
        break;
      }
      case "paragraph_open": {
        // A paragraph directly inside a list item continues that item's line
        // (the marker was already emitted); otherwise it's a new block.
        if (!inListItem) pushSep("\n\n");
        const inline = tokens[i + 1];
        const base: RunStyle = inBlockquote > 0 ? "italic" : "normal";
        if (inline?.type === "inline") inlineRuns(inline, base, runs);
        i += 2; // skip inline + paragraph_close
        inListItem = false;
        break;
      }
      case "ordered_list_open":
        pushSep("\n\n");
        listCounters.push(Number(t.markup === "." ? 1 : 1)); // start at 1
        break;
      case "bullet_list_open":
        pushSep("\n\n");
        listCounters.push(0); // 0 marks a bullet list
        break;
      case "ordered_list_close":
      case "bullet_list_close":
        listCounters.pop();
        break;
      case "list_item_open": {
        const depth = listCounters.length - 1;
        const counter = listCounters[depth];
        // Separate items with a single newline (not a blank line).
        if (runs.length && !endsWith(runs, "\n")) runs.push({ text: "\n", style: "normal" });
        if (counter === 0) {
          runs.push({ text: "•  ", style: "marker" });
        } else {
          runs.push({ text: `${counter}.  `, style: "marker" });
          listCounters[depth] = counter + 1;
        }
        inListItem = true;
        break;
      }
      case "list_item_close":
        inListItem = false;
        break;
      case "blockquote_open":
        pushSep("\n\n");
        inBlockquote++;
        break;
      case "blockquote_close":
        inBlockquote--;
        break;
      case "hr":
        pushSep("\n\n");
        runs.push({ text: "—　—　—", style: "marker" });
        break;
      default:
        break;
    }
  }

  return { runs, plainText: runs.map((r) => r.text).join("") };
}

function endsWith(runs: Run[], s: string): boolean {
  const last = runs[runs.length - 1];
  return !!last && last.text.endsWith(s);
}
