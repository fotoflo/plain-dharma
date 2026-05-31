import { useMemo, type ReactNode } from "react";
import { StyleSheet, Text } from "react-native";
import Markdown, { type ASTNode, type RenderRules } from "react-native-markdown-display";

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
 * When `highlights` are supplied, each leaf text node is scanned for a stored
 * quote and the matching run is wrapped in a colored, tappable span — the
 * mobile equivalent of the web's inline `<mark>`. This resolves marks created
 * on web (or via sentence-pick on mobile) as inline shading. Limitation: a
 * quote that spans markdown styling (bold/italic/links) lands across multiple
 * leaves and won't match a single leaf, so it falls back to the section-level
 * accent rail; plain-prose quotes (the common case) paint inline.
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

  // Override the leaf `text` rule to shade any stored quote it contains. With no
  // highlights this is identical to the library default.
  const rules = useMemo<RenderRules | undefined>(() => {
    if (!highlights || highlights.length === 0) return undefined;
    return {
      text: (
        node: ASTNode,
        _children: ReactNode[],
        _parent: ASTNode[],
        s: { text?: object },
        inherited: object = {},
      ) => {
        const segments = splitByHighlights(node.content, highlights);
        if (segments.length === 1 && !segments[0].markId) {
          return (
            <Text key={node.key} style={[inherited, s.text]}>
              {node.content}
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
  }, [highlights, onPressHighlight, theme]);

  return (
    <Markdown style={styles} rules={rules}>
      {children}
    </Markdown>
  );
}

type Seg = { text: string; markId?: string; color?: string };

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
