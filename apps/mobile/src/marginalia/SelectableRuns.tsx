/**
 * The shared rendering core behind native text selection: a flat sequence of
 * styled inline "runs" drawn as ONE react-native-uitextview, so an iOS
 * selection can span across them (iOS selection can't cross separate text
 * views). It paints saved highlights inline and reports a settled selection as
 * {quote, rect}.
 *
 * Both SelectableSectionText (reader prose) and SelectableTitle (the title
 * block) feed it runs + a per-style resolver — the only thing that differs
 * between them is how the runs and their styles are built. See sectionRuns.ts
 * for the block→inline flattening prose uses.
 */

import { useMemo, useRef, type ReactNode } from "react";
import { type TextStyle } from "react-native";
import { UITextView } from "react-native-uitextview";

import { highlightWash } from "./colors";
import type { Run, RunStyle } from "./sectionRuns";
import type { InlineHighlight, SelectionRect } from "@/components/MarkdownRenderer";
import type { ThemeName } from "@/theme/tokens";

export function SelectableRuns({
  runs,
  plainText,
  bodyStyle,
  runStyle,
  theme,
  highlights,
  onPressHighlight,
  onSelectQuote,
  onSelectionCleared,
  onPressAt,
}: {
  runs: Run[];
  /** Exactly the runs joined — the string native selection offsets index into. */
  plainText: string;
  /** Style on the outer UITextView (default color/font/size for the run text). */
  bodyStyle: TextStyle;
  /** Maps a run's style to its TextStyle override (undefined = inherit body). */
  runStyle: (s: RunStyle) => TextStyle | undefined;
  theme: ThemeName;
  highlights: InlineHighlight[];
  onPressHighlight: (markId: string) => void;
  onSelectQuote: (quote: string, rect: SelectionRect) => void;
  onSelectionCleared: () => void;
  /**
   * Tap on plain (non-highlight) text, reporting the raw plainText offset of
   * the tapped span — the consumer maps it to its enclosing paragraph (the
   * source-peek sheet). Same nested-span onPress mechanism highlight taps
   * use, so it coexists with native long-press selection. Highlight spans
   * keep their own handler (edit wins over peek).
   */
  onPressAt?: (rawOffset: number) => void;
}) {
  const selTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Paint saved highlights. A stored quote is whitespace-COLLAPSED and may span
  // multiple runs (e.g. a bold word + following prose), so a per-run substring
  // match fails. Instead we locate each quote in a collapsed copy of plainText,
  // map it back to raw [start,end) offsets, then tint whatever slice of each run
  // overlaps a highlighted range — the same offset space the selection used.
  const children = useMemo<ReactNode[]>(() => {
    const valid = highlights.filter((h) => h.quote);

    // Collapsed text + a map from each collapsed index to its raw index.
    const collapsedToRaw: number[] = [];
    let collapsed = "";
    let prevWasSpace = false;
    for (let i = 0; i < plainText.length; i++) {
      const ch = plainText[i];
      if (/\s/.test(ch)) {
        if (prevWasSpace || collapsed.length === 0) continue; // collapse runs, trim leading
        collapsed += " ";
        collapsedToRaw.push(i);
        prevWasSpace = true;
      } else {
        collapsed += ch;
        collapsedToRaw.push(i);
        prevWasSpace = false;
      }
    }
    const collapsedTrimmed = collapsed.replace(/\s+$/, "");

    // Opening punctuation a highlight should swallow when it sits right before
    // the quote (iOS word-selection starts at the first letter, leaving a
    // dangling “ or ‘ unhighlighted).
    const OPENERS = new Set(['"', "'", "“", "‘", "«", "‹", "„", "("]);

    // Highlighted raw ranges + the mark each covers (for the tap target).
    type Range = { start: number; end: number; markId: string; color: string };
    const ranges: Range[] = [];
    for (const h of valid) {
      const q = h.quote.replace(/\s+/g, " ").trim();
      if (!q) continue;
      let from = 0;
      let idx: number;
      while ((idx = collapsedTrimmed.indexOf(q, from)) !== -1) {
        let rawStart = collapsedToRaw[idx];
        const rawEnd = collapsedToRaw[idx + q.length - 1] + 1; // inclusive→exclusive
        // Extend back over an immediately-preceding opening quote/paren.
        while (rawStart > 0 && OPENERS.has(plainText[rawStart - 1])) rawStart--;
        ranges.push({ start: rawStart, end: rawEnd, markId: h.markId, color: h.color });
        from = idx + q.length;
      }
    }

    const colorAt = (rawIndex: number): Range | undefined =>
      ranges.find((r) => rawIndex >= r.start && rawIndex < r.end);

    const out: ReactNode[] = [];
    let key = 0;
    let cursor = 0; // raw offset at the start of the current run
    for (let ri = 0; ri < runs.length; ri++) {
      const run = runs[ri];
      const baseStyle = runStyle(run.style);
      const text = run.text;
      const runStart = cursor;
      cursor += text.length;

      if (ranges.length === 0) {
        out.push(
          <UITextView
            key={key++}
            style={baseStyle}
            onPress={onPressAt ? () => onPressAt(runStart) : undefined}
          >
            {text}
          </UITextView>,
        );
        continue;
      }

      // A list marker ("1.  ", "•  ") tints with its item: shade it when the
      // first character of the following content run is highlighted.
      if (run.style === "marker") {
        const next = runs[ri + 1];
        const mark = next && next.style !== "marker" ? colorAt(cursor) : undefined;
        out.push(
          mark ? (
            <UITextView
              key={key++}
              onPress={() => onPressHighlight(mark.markId)}
              style={[baseStyle, { backgroundColor: highlightWash(mark.color, theme) }]}
            >
              {text}
            </UITextView>
          ) : (
            <UITextView
              key={key++}
              style={baseStyle}
              onPress={onPressAt ? () => onPressAt(runStart) : undefined}
            >
              {text}
            </UITextView>
          ),
        );
        continue;
      }

      // Walk the run, emitting plain / tinted slices as the highlight membership
      // of each character changes.
      let segStart = 0;
      let segMark = colorAt(runStart);
      for (let i = 1; i <= text.length; i++) {
        const here = i < text.length ? colorAt(runStart + i) : undefined;
        const boundary = i === text.length || here?.markId !== segMark?.markId;
        if (boundary) {
          const slice = text.slice(segStart, i);
          if (segMark) {
            const markId = segMark.markId;
            const color = segMark.color;
            out.push(
              <UITextView
                key={key++}
                onPress={() => onPressHighlight(markId)}
                style={[baseStyle, { backgroundColor: highlightWash(color, theme) }]}
              >
                {slice}
              </UITextView>,
            );
          } else {
            const sliceStart = runStart + segStart;
            out.push(
              <UITextView
                key={key++}
                style={baseStyle}
                onPress={onPressAt ? () => onPressAt(sliceStart) : undefined}
              >
                {slice}
              </UITextView>,
            );
          }
          segStart = i;
          segMark = here;
        }
      }
    }
    return out;
  }, [runs, plainText, highlights, runStyle, theme, onPressHighlight, onPressAt]);

  return (
    <UITextView
      selectable
      uiTextView
      style={bodyStyle}
      onSelectionChange={(e) => {
        const ne = e.nativeEvent as typeof e.nativeEvent & {
          selectionX?: number;
          selectionY?: number;
          selectionWidth?: number;
          selectionHeight?: number;
        };
        const { start, end } = ne;
        if (selTimer.current) clearTimeout(selTimer.current);
        if (start >= end) {
          onSelectionCleared();
          return;
        }
        const rect: SelectionRect = {
          x: ne.selectionX ?? 0,
          y: ne.selectionY ?? 0,
          width: ne.selectionWidth ?? 0,
          height: ne.selectionHeight ?? 0,
        };
        selTimer.current = setTimeout(() => {
          const quote = plainText.slice(start, end).replace(/\s+/g, " ").trim();
          if (quote) onSelectQuote(quote, rect);
        }, 250);
      }}
    >
      {children}
    </UITextView>
  );
}
