/**
 * A whole reader section rendered as ONE react-native-uitextview, so native iOS
 * selection can span across its paragraphs (iOS selection can't cross separate
 * text views — see sectionRuns.ts for the block→inline flattening and its
 * tradeoffs). Emits the same {quote, rect} on a settled selection and paints
 * saved highlights inline, matching the per-paragraph renderer it replaces for
 * selection.
 */

import { useMemo, useRef, type ReactNode } from "react";
import { StyleSheet, type TextStyle } from "react-native";
import { UITextView } from "react-native-uitextview";

import { highlightWash } from "./colors";
import { sectionToRuns, type Run } from "./sectionRuns";
import type { InlineHighlight, SelectionRect } from "@/components/MarkdownRenderer";
import { useReadingPrefs } from "@/theme/ReadingPrefsContext";
import { useTheme } from "@/theme/ThemeContext";
import { BASE_FONT_SIZE, BASE_LINE_HEIGHT, CONTRAST_INK, FONTS } from "@/theme/tokens";

export function SelectableSectionText({
  markdown,
  highlights,
  onPressHighlight,
  onSelectQuote,
  onSelectionCleared,
}: {
  markdown: string;
  highlights: InlineHighlight[];
  onPressHighlight: (markId: string) => void;
  onSelectQuote: (quote: string, rect: SelectionRect) => void;
  onSelectionCleared: () => void;
}) {
  const { theme, palette } = useTheme();
  const { scale, contrast, font } = useReadingPrefs();
  const selTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { runs, plainText } = useMemo(() => sectionToRuns(markdown), [markdown]);

  const styles = useMemo(() => {
    const ink = CONTRAST_INK[theme][contrast];
    const fontSize = BASE_FONT_SIZE * scale;
    const lineHeight = fontSize * BASE_LINE_HEIGHT;
    const bodyFont = font === "accessible" ? FONTS.accessible : FONTS.serif;
    const boldFont = font === "accessible" ? FONTS.accessibleBold : FONTS.serifBold;
    const italicFont = font === "accessible" ? FONTS.accessibleItalic : FONTS.serifItalic;
    return StyleSheet.create({
      body: { color: ink, fontFamily: bodyFont, fontSize, lineHeight },
      bold: { fontFamily: boldFont, color: ink },
      italic: { fontFamily: italicFont },
      // Headings can't carry block margin inside a UITextView; keep them bold +
      // a touch larger so they still read as headings.
      heading: { fontFamily: FONTS.serifBold, color: ink, fontSize: fontSize * 1.15 },
      link: { color: palette.link, textDecorationLine: "underline" as const },
      marker: { color: ink, fontFamily: bodyFont },
    });
  }, [theme, palette, scale, contrast, font]);

  const runStyle = (s: Run["style"]): TextStyle | undefined => {
    switch (s) {
      case "bold":
        return styles.bold;
      case "italic":
        return styles.italic;
      case "heading":
        return styles.heading;
      case "link":
        return styles.link;
      case "marker":
        return styles.marker;
      default:
        return undefined;
    }
  };

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
          <UITextView key={key++} style={baseStyle}>
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
            <UITextView key={key++} style={baseStyle}>
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
            out.push(
              <UITextView key={key++} style={baseStyle}>
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
    // runStyle is derived from styles (in deps); highlights/runs/theme drive paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runs, plainText, highlights, styles, theme, onPressHighlight]);

  return (
    <UITextView
      selectable
      uiTextView
      style={styles.body}
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
