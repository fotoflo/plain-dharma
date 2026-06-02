/**
 * A whole reader section rendered as ONE react-native-uitextview, so native iOS
 * selection can span across its paragraphs (iOS selection can't cross separate
 * text views — see sectionRuns.ts for the block→inline flattening and its
 * tradeoffs). Builds the section's styled runs, then hands them to the shared
 * SelectableRuns core which paints saved highlights and reports selections.
 */

import { useCallback, useMemo } from "react";
import { StyleSheet, type TextStyle } from "react-native";

import { SelectableRuns } from "./SelectableRuns";
import { sectionToRuns, type RunStyle } from "./sectionRuns";
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

  const runStyle = useCallback(
    (s: RunStyle): TextStyle | undefined => {
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
    },
    [styles],
  );

  return (
    <SelectableRuns
      runs={runs}
      plainText={plainText}
      bodyStyle={styles.body}
      runStyle={runStyle}
      theme={theme}
      highlights={highlights}
      onPressHighlight={onPressHighlight}
      onSelectQuote={onSelectQuote}
      onSelectionCleared={onSelectionCleared}
    />
  );
}
