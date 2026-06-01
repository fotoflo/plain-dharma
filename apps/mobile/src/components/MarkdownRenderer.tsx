import { useMemo, useRef, type ReactNode } from "react";
import { StyleSheet, Text, type TextStyle } from "react-native";
import Markdown, { type ASTNode, type RenderRules } from "react-native-markdown-display";
import { UITextView } from "react-native-uitextview";

import { highlightWash } from "../marginalia/colors";
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
 * Two optional layers ride on the leaf rules:
 *
 *  1. **Saved highlights** (`highlights`): each leaf is scanned for a stored
 *     quote and the matching run gets a colored, tappable wash — the mobile
 *     equivalent of the web's inline `<mark>`. A quote that straddles markdown
 *     styling (bold/italic) lands across multiple render leaves and won't match a
 *     single leaf, so it falls back to the section-level accent rail; plain-prose
 *     quotes (the common case) paint inline.
 *
 *  2. **Native selection** (`selectable`): each paragraph's inline container
 *     (`textgroup`) renders through react-native-uitextview's `UITextView`, a
 *     real iOS `UITextView` that supports the native press-and-drag selection
 *     grabbers + loupe. Base `<Text>` children (incl. the highlight runs above)
 *     auto-convert to UITextView children, so block layout and inline styling are
 *     untouched. `onSelectionChange` reports `{start,end}` UTF-16 offsets into the
 *     paragraph's text; we slice that paragraph's reconstructed string to the
 *     selected quote and hand it up (`onSelectQuote`). This replaces the old
 *     measure-every-word approach, which is impossible on iOS (a `<Text>` nested
 *     in a `<Text>` is an attributed-string run, not a view — onLayout never
 *     fires). Selection is per-paragraph (native text views don't span across
 *     sibling containers); cross-paragraph selection is the documented limit.
 */
export function MarkdownRenderer({
  children,
  highlights,
  onPressHighlight,
  selectable,
  onSelectQuote,
  onSelectionCleared,
}: {
  children: string;
  highlights?: InlineHighlight[];
  onPressHighlight?: (markId: string) => void;
  /** Enable native (UITextView) text selection on each paragraph. iOS only. */
  selectable?: boolean;
  /** A settled, non-empty selection — the selected text (whitespace-collapsed). */
  onSelectQuote?: (quote: string) => void;
  /** The native selection collapsed/cleared — close the toolbar (web parity). */
  onSelectionCleared?: () => void;
}) {
  const { theme, palette } = useTheme();
  const { scale, contrast, font } = useReadingPrefs();
  // Debounce the high-frequency native selection-change events (fire on every
  // grabber edge adjustment) so we only act on a settled selection.
  const selTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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

  // Build custom leaf rules only when a layer needs them — with neither saved
  // highlights nor selection this is the library default.
  const rules = useMemo<RenderRules | undefined>(() => {
    const hasHighlights = !!highlights && highlights.length > 0;
    if (!hasHighlights && !selectable) return undefined;

    const r: RenderRules = {};

    // Selection: render each paragraph's inline container as a UITextView so iOS
    // gives us native selection. The library only draws string children or its
    // OWN nested <UITextView> spans — plain RN <Text> from the default rules
    // render invisible — so we build the inline content ourselves from the AST
    // (renderInline), applying emphasis via nested UITextView. The root carries
    // the body text style (font/size/color/lineHeight) so it's actually visible.
    if (selectable) {
      r.textgroup = (node: ASTNode) => {
        // groupText is exactly what we render, so native offsets slice back to
        // the right substring.
        const groupText = nodeText(node);
        return (
          <UITextView
            key={node.key}
            selectable
            uiTextView
            // Only the text style (font/size/color/lineHeight) — NOT paragraph
            // margins: the surrounding paragraph/list_item block already spaces
            // it, so adding margin here double-spaces and breaks list rows.
            style={styles.body}
            onSelectionChange={(e) => {
              const { start, end } = e.nativeEvent;
              if (selTimer.current) clearTimeout(selTimer.current);
              if (start >= end) {
                // Selection collapsed/cleared (tap-away, or grabbers dragged
                // together) — dismiss the toolbar, mirroring the web's
                // selectionchange → isCollapsed path. Without this the toolbar
                // freezes in place after the first selection.
                onSelectionCleared?.();
                return;
              }
              selTimer.current = setTimeout(() => {
                // Collapse whitespace (incl. soft line breaks) so the quote
                // matches sectionPlainText, which selectorForQuote searches.
                const quote = groupText.slice(start, end).replace(/\s+/g, " ").trim();
                if (quote) onSelectQuote?.(quote);
              }, 250);
            }}
          >
            {renderInline(node, styles, theme, highlights, onPressHighlight)}
          </UITextView>
        );
      };
    }

    // Saved highlights: paint stored quotes inline as a colored, tappable wash.
    if (hasHighlights) {
      r.text = (
        node: ASTNode,
        _children: ReactNode[],
        _parent: ASTNode[],
        s: { text?: object },
        inherited: object = {},
      ) => {
        const content: string = node.content;
        const segments = splitByHighlights(content, highlights as InlineHighlight[]);
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
      };
    }

    return r;
  }, [highlights, onPressHighlight, theme, selectable, onSelectQuote, onSelectionCleared, styles]);

  return (
    <Markdown style={styles} rules={rules}>
      {children}
    </Markdown>
  );
}

type Seg = { text: string; markId?: string; color?: string };

/**
 * Reconstruct the plain text a `textgroup` (paragraph/heading inline container)
 * renders, so native selection offsets (UTF-16 into the rendered string) map
 * back to a quote. Mirrors react-native-markdown-display's leaf output: text
 * nodes contribute their content; soft/hard breaks render as a newline.
 */
function nodeText(node: ASTNode): string {
  if (node.type === "text") return node.content ?? "";
  if (node.type === "softbreak" || node.type === "hardbreak") return "\n";
  const kids = node.children as ASTNode[] | undefined;
  if (kids && kids.length) return kids.map(nodeText).join("");
  return node.content ?? "";
}

type MdStyles = Record<string, TextStyle>;

/**
 * Render an inline AST node (paragraph/heading content) as UITextView-compatible
 * children: bare strings for text, nested <UITextView> for emphasis/links, and a
 * saved-highlight wash on text runs that fall inside a stored quote. We render
 * children ourselves (not via the library's default rules) because UITextView
 * only draws strings or its own nested spans — a plain RN <Text> child renders
 * invisible. The output string must equal nodeText(node) so selection offsets
 * line up.
 */
function renderInline(
  node: ASTNode,
  styles: MdStyles,
  theme: "light" | "dark",
  highlights?: InlineHighlight[],
  onPressHighlight?: (markId: string) => void,
  keyPrefix = "i",
): ReactNode[] {
  const out: ReactNode[] = [];
  const kids = (node.children as ASTNode[] | undefined) ?? [];
  kids.forEach((child, idx) => {
    const key = `${keyPrefix}-${idx}`;
    switch (child.type) {
      case "text": {
        const content = child.content ?? "";
        const segs =
          highlights && highlights.length
            ? splitByHighlights(content, highlights)
            : [{ text: content } as Seg];
        segs.forEach((seg, i) => {
          if (seg.markId) {
            out.push(
              <UITextView
                key={`${key}-h${i}`}
                onPress={onPressHighlight ? () => onPressHighlight(seg.markId as string) : undefined}
                style={{ backgroundColor: highlightWash(seg.color, theme) }}
              >
                {seg.text}
              </UITextView>,
            );
          } else {
            out.push(seg.text);
          }
        });
        break;
      }
      case "softbreak":
      case "hardbreak":
        out.push("\n");
        break;
      case "strong":
        out.push(
          <UITextView key={key} style={styles.strong}>
            {renderInline(child, styles, theme, highlights, onPressHighlight, key)}
          </UITextView>,
        );
        break;
      case "em":
        out.push(
          <UITextView key={key} style={styles.em}>
            {renderInline(child, styles, theme, highlights, onPressHighlight, key)}
          </UITextView>,
        );
        break;
      case "link":
        out.push(
          <UITextView key={key} style={styles.link}>
            {renderInline(child, styles, theme, highlights, onPressHighlight, key)}
          </UITextView>,
        );
        break;
      default:
        // Unknown inline node — recurse so its text still appears (and counts
        // toward the offset), unstyled.
        if (child.children?.length) {
          out.push(...renderInline(child, styles, theme, highlights, onPressHighlight, key));
        } else if (child.content) {
          out.push(child.content);
        }
    }
  });
  return out;
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
