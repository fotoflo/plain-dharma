import { useMemo, useRef, type ReactNode } from "react";
import { StyleSheet, Text } from "react-native";
import Markdown, { type ASTNode, type RenderRules } from "react-native-markdown-display";

import { highlightWash } from "../marginalia/colors";
import { splitLeaf } from "../marginalia/sections";
import {
  useWordSelectionContext,
  type WordSelectionContextValue,
} from "../marginalia/selection";
import { useReadingPrefs } from "../theme/ReadingPrefsContext";
import { useTheme } from "../theme/ThemeContext";
import { BASE_FONT_SIZE, BASE_LINE_HEIGHT, CONTRAST_INK, FONTS } from "../theme/tokens";

/** A resolved highlight to paint inline: a quote string + its mark + color. */
export type InlineHighlight = { markId: string; quote: string; color: string };

/**
 * Renders a sutta's plain-Markdown body, mirroring the web `.prose-dharma`
 * styles: Garamond Libre serif, saffron h2 headings, warm hairline rules,
 * accent-barred blockquotes. Body size follows the reader's size pref
 * (READING_SCALE) and text color follows the contrast pref.
 *
 * Two optional layers ride on the leaf `text` rule:
 *
 *  1. **Saved highlights** (`highlights`): each leaf is scanned for a stored
 *     quote and the matching run gets a colored, tappable wash — the mobile
 *     equivalent of the web's inline `<mark>`. Resolves marks created on web (or
 *     by dragging here). A quote that straddles markdown styling (bold/italic)
 *     lands across multiple render leaves and won't match a single leaf, so it
 *     falls back to the section-level accent rail; plain-prose quotes (the
 *     common case) paint inline.
 *
 *  2. **Word-selection mode**: when a `WordSelectionContext` is present (the
 *     reader's drag-to-select), every body word renders in its own measurable
 *     <Text> that reports its section-local frame and shades while inside the
 *     live selection. This is how mobile recovers a Range-like selection without
 *     a DOM (see selection.tsx). Bold/italic runs keep their style because the
 *     split happens *inside* the existing `text` rule, preserving `inherited`.
 */
export function MarkdownRenderer({
  children,
  highlights,
  onPressHighlight,
}: {
  children: string;
  highlights?: InlineHighlight[];
  onPressHighlight?: (markId: string) => void;
}) {
  const { theme, palette } = useTheme();
  const { scale, contrast, font } = useReadingPrefs();
  const selection = useWordSelectionContext();

  const styles = useMemo(() => {
    const ink = CONTRAST_INK[theme][contrast];
    const fontSize = BASE_FONT_SIZE * scale;
    const lineHeight = fontSize * BASE_LINE_HEIGHT;
    // Accessible font swaps body text only — headings keep Garamond (per web).
    const bodyFont = font === "accessible" ? FONTS.accessible : FONTS.serif;
    const boldFont = font === "accessible" ? FONTS.accessibleBold : FONTS.serifBold;
    const italicFont =
      font === "accessible" ? FONTS.accessibleItalic : FONTS.serifItalic;

    return StyleSheet.create({
      // Root — text styles cascade to all inline content.
      body: {
        color: ink,
        fontFamily: bodyFont,
        fontSize,
        lineHeight,
      },
      paragraph: {
        marginTop: fontSize * 1.1,
        marginBottom: fontSize * 1.1,
      },
      heading1: {
        fontFamily: FONTS.serifBold,
        color: ink,
        fontSize: 32,
        lineHeight: 32 * 1.2,
        marginTop: 0,
        marginBottom: 8,
      },
      heading2: {
        fontFamily: FONTS.serifBold,
        color: palette.accent,
        fontSize: 24,
        lineHeight: 24 * 1.3,
        marginTop: 40,
        marginBottom: 16,
      },
      heading3: {
        fontFamily: FONTS.serifBold,
        color: ink,
        fontSize: 19,
        lineHeight: 19 * 1.4,
        marginTop: 32,
        marginBottom: 12,
      },
      // Custom fonts don't synthesize bold/italic — switch the family instead.
      strong: { fontFamily: boldFont, color: ink },
      em: { fontFamily: italicFont },
      bullet_list: { marginTop: fontSize, marginBottom: fontSize },
      ordered_list: { marginTop: fontSize, marginBottom: fontSize },
      list_item: { marginTop: 4, marginBottom: 4 },
      bullet_list_icon: { color: ink },
      ordered_list_icon: { color: ink },
      hr: {
        backgroundColor: palette.divider,
        height: 1,
        marginVertical: 28,
        width: "40%",
        alignSelf: "center",
      },
      blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: palette.accent,
        paddingLeft: 16,
        marginVertical: 20,
        backgroundColor: "transparent",
      },
      link: {
        color: palette.link,
        textDecorationLine: "underline",
      },
    });
  }, [theme, palette, scale, contrast, font]);

  // Override the leaf `text` rule. With neither saved highlights nor selection
  // mode this is identical to the library default. Word-selection mode (when a
  // context is present) takes priority because it renders measurable per-word
  // spans that also carry any saved-highlight wash.
  const rules = useMemo<RenderRules | undefined>(() => {
    const hasHighlights = !!highlights && highlights.length > 0;
    if (!hasHighlights && !selection) return undefined;

    return {
      text: (
        node: ASTNode,
        _children: ReactNode[],
        _parent: ASTNode[],
        s: { text?: object },
        inherited: object = {},
      ) => {
        const content: string = node.content;

        // Char-range membership of saved highlights within this leaf, so a word
        // (or a plain run) can pick up the stored wash + tap target.
        const segments = hasHighlights
          ? splitByHighlights(content, highlights as InlineHighlight[])
          : [{ text: content } as Seg];

        if (selection) {
          return (
            <Text key={node.key} style={[inherited, s.text]}>
              {renderSelectableSegments(segments, selection, theme, onPressHighlight)}
            </Text>
          );
        }

        // Saved-highlights-only path (no selection mode active).
        if (segments.length === 1 && !segments[0].markId) {
          return (
            <Text key={node.key} style={[inherited, s.text]}>
              {content}
            </Text>
          );
        }
        return (
          <Text key={node.key} style={[inherited, s.text]}>
            {segments.map((seg, i) =>
              seg.markId ? (
                <Text
                  key={i}
                  onPress={
                    onPressHighlight ? () => onPressHighlight(seg.markId as string) : undefined
                  }
                  style={{ backgroundColor: highlightWash(seg.color, theme) }}
                >
                  {seg.text}
                </Text>
              ) : (
                seg.text
              ),
            )}
          </Text>
        );
      },
    };
  }, [highlights, onPressHighlight, theme, selection]);

  return (
    <Markdown style={styles} rules={rules}>
      {children}
    </Markdown>
  );
}

type Seg = { text: string; markId?: string; color?: string };

/**
 * In word-selection mode, render each segment as a run of measurable per-word
 * spans. A word carries: (a) the live-selection wash when its index is in range,
 * else (b) the saved-highlight wash + tap target when it sits inside a stored
 * quote. Whitespace pieces render inline as plain text (not selectable).
 */
function renderSelectableSegments(
  segments: Seg[],
  selection: WordSelectionContextValue,
  theme: "light" | "dark",
  onPressHighlight?: (markId: string) => void,
): ReactNode[] {
  const out: ReactNode[] = [];
  let key = 0;
  for (const seg of segments) {
    const pieces = splitLeaf(seg.text);
    for (const piece of pieces) {
      if (piece.kind === "space") {
        out.push(piece.text);
        continue;
      }
      const index = selection.nextWordIndex();
      out.push(
        <MeasurableWord
          key={key++}
          index={index}
          text={piece.text}
          selection={selection}
          savedColor={seg.markId ? seg.color : undefined}
          savedMarkId={seg.markId}
          theme={theme}
          onPressHighlight={onPressHighlight}
        />,
      );
    }
  }
  return out;
}

/**
 * One selectable word. Reports its section-local frame via measureLayout on
 * layout (and again when the layout settles), and shades while inside the live
 * selection or a saved highlight. Tapping a saved-highlight word edits the mark.
 */
function MeasurableWord({
  index,
  text,
  selection,
  savedColor,
  savedMarkId,
  theme,
  onPressHighlight,
}: {
  index: number;
  text: string;
  selection: WordSelectionContextValue;
  savedColor?: string;
  savedMarkId?: string;
  theme: "light" | "dark";
  onPressHighlight?: (markId: string) => void;
}) {
  const ref = useRef<Text>(null);

  const onLayout = () => {
    const node = selection.sectionRef.current;
    const el = ref.current;
    if (!node || !el) return;
    // measureLayout against the section host view gives a stable section-local
    // coordinate space the drag hit-tests against (the non-deprecated
    // HostInstance overload, not a node-handle number).
    el.measureLayout(
      node,
      (x, y, width, height) => {
        selection.setFrame({ index, text, x, y, width, height });
      },
      () => {},
    );
  };

  const selected = selection.isSelected(index);
  const background = selected
    ? selection.washColor
    : savedColor != null
      ? highlightWash(savedColor, theme)
      : undefined;

  return (
    <Text
      ref={ref}
      onLayout={onLayout}
      onPress={
        !selection.active && savedMarkId && onPressHighlight
          ? () => onPressHighlight(savedMarkId)
          : undefined
      }
      style={background ? { backgroundColor: background } : undefined}
    >
      {text}
    </Text>
  );
}

/**
 * Split a leaf string into highlighted / plain runs. Greedy left-to-right over
 * the longest-first quote list so a longer quote wins an overlap. Quotes that
 * don't appear wholly within this leaf are simply skipped here (handled by the
 * section-level rail fallback in the reader).
 */
function splitByHighlights(text: string, highlights: InlineHighlight[]): Seg[] {
  const ordered = [...highlights].sort((a, b) => b.quote.length - a.quote.length);
  const segs: Seg[] = [];
  let pos = 0;

  while (pos < text.length) {
    let bestIdx = -1;
    let best: InlineHighlight | null = null;
    for (const h of ordered) {
      if (!h.quote) continue;
      const idx = text.indexOf(h.quote, pos);
      if (idx >= 0 && (bestIdx === -1 || idx < bestIdx)) {
        bestIdx = idx;
        best = h;
      }
    }
    if (bestIdx === -1 || !best) {
      segs.push({ text: text.slice(pos) });
      break;
    }
    if (bestIdx > pos) segs.push({ text: text.slice(pos, bestIdx) });
    segs.push({ text: best.quote, markId: best.markId, color: best.color });
    pos = bestIdx + best.quote.length;
  }

  return segs.length ? segs : [{ text }];
}
