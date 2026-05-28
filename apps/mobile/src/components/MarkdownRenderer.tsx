import { useMemo } from "react";
import { StyleSheet } from "react-native";
import Markdown from "react-native-markdown-display";

import { useReadingPrefs } from "../theme/ReadingPrefsContext";
import { useTheme } from "../theme/ThemeContext";
import { BASE_FONT_SIZE, BASE_LINE_HEIGHT, CONTRAST_INK, FONTS } from "../theme/tokens";

/**
 * Renders a sutta's plain-Markdown body, mirroring the web `.prose-dharma`
 * styles: Garamond Libre serif, saffron h2 headings, warm hairline rules,
 * accent-barred blockquotes. Body size follows the reader's size pref
 * (READING_SCALE) and text color follows the contrast pref.
 */
export function MarkdownRenderer({ children }: { children: string }) {
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

  return <Markdown style={styles}>{children}</Markdown>;
}
