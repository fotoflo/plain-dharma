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
import { useLocale } from "@/i18n/LocaleContext";
import { useReadingPrefs } from "@/theme/ReadingPrefsContext";
import { useTheme } from "@/theme/ThemeContext";
import {
  BASE_FONT_SIZE,
  BASE_LINE_HEIGHT,
  CONTRAST_INK,
  readerFonts,
} from "@/theme/tokens";

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
  const { locale } = useLocale();

  const { runs, plainText } = useMemo(() => sectionToRuns(markdown), [markdown]);

  const styles = useMemo(() => {
    const ink = CONTRAST_INK[theme][contrast];
    const fontSize = BASE_FONT_SIZE * scale;
    const lineHeight = fontSize * BASE_LINE_HEIGHT;
    const f = readerFonts(font, locale);
    // zh has one CJK family, so bold/heading come from weight, not a bold face.
    const boldWeight = f.boldWeight ? { fontWeight: f.boldWeight } : null;
    return StyleSheet.create({
      body: { color: ink, fontFamily: f.body, fontSize, lineHeight },
      bold: { fontFamily: f.bold, color: ink, ...boldWeight },
      italic: { fontFamily: f.italic },
      // Headings can't carry block margin inside a UITextView; keep them bold +
      // a touch larger so they still read as headings.
      heading: { fontFamily: f.bold, color: ink, fontSize: fontSize * 1.15, ...boldWeight },
      link: { color: palette.link, textDecorationLine: "underline" as const },
      marker: { color: ink, fontFamily: f.body },
    });
  }, [theme, palette, scale, contrast, font, locale]);

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
