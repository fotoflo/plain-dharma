/**
 * The reader's title block (Pali-name kicker + title + subtitle) rendered as ONE
 * selectable react-native-uitextview, so the same press-and-drag highlight that
 * works on the body prose also works on the header and subheader. These three
 * lines come from frontmatter (SUTTA_META), not the section Markdown, so they're
 * built into runs here rather than flowing through sectionToRuns.
 *
 * A single text view (not three <Text>s) is what lets an iOS selection span the
 * lines and lets highlights paint inline; the per-line block margins of the old
 * plain-<Text> block become line breaks — the documented UITextView tradeoff
 * (see sectionRuns.ts).
 */

import { useCallback, useMemo } from "react";
import { StyleSheet, type TextStyle } from "react-native";

import { SelectableRuns } from "./SelectableRuns";
import type { SelectionResult } from "./SelectableSection";
import type { Run, RunStyle } from "./sectionRuns";
import type { InlineHighlight } from "@/components/MarkdownRenderer";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

/** Section id the title block anchors its highlights/selection to. */
export const TITLE_SECTION_ID = "title";

/**
 * The synthetic section markdown for the title, used by the marginalia engine to
 * resolve a selected quote into a text-quote selector. It only needs to contain
 * the same words (whitespace is collapsed on both sides), so a plain join works.
 */
export function titleSectionMarkdown(
  kicker: string | undefined,
  title: string,
  subtitle: string,
): string {
  return [kicker, title, subtitle].filter(Boolean).join("\n\n");
}

export function SelectableTitle({
  kicker,
  title,
  subtitle,
  highlights,
  onPressHighlight,
  onSelect,
  onSelectionCleared,
}: {
  kicker?: string;
  title: string;
  subtitle: string;
  highlights: InlineHighlight[];
  onPressHighlight: (markId: string) => void;
  /** Fired when a native selection settles — anchored to TITLE_SECTION_ID. */
  onSelect: (result: SelectionResult) => void;
  onSelectionCleared: () => void;
}) {
  const { theme, palette } = useTheme();

  const { runs, plainText } = useMemo(() => {
    const out: Run[] = [];
    const push = (text: string, style: RunStyle) => {
      if (out.length > 0) out.push({ text: "\n", style: "normal" });
      out.push({ text, style });
    };
    if (kicker) push(kicker, "kicker");
    push(title, "h1");
    if (subtitle) push(subtitle, "subtitle");
    return { runs: out, plainText: out.map((r) => r.text).join("") };
  }, [kicker, title, subtitle]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: { color: palette.ink, fontFamily: FONTS.serif, fontSize: 18 },
        kicker: {
          color: palette.accent,
          fontFamily: FONTS.serif,
          fontSize: 14,
          letterSpacing: 1,
          textTransform: "uppercase" as const,
        },
        h1: { color: palette.ink, fontFamily: FONTS.serifBold, fontSize: 30, lineHeight: 36 },
        subtitle: {
          color: palette.ink,
          fontFamily: FONTS.serifItalic,
          fontSize: 18,
          lineHeight: 26,
        },
      }),
    [palette],
  );

  const runStyle = useCallback(
    (s: RunStyle): TextStyle | undefined => {
      switch (s) {
        case "kicker":
          return styles.kicker;
        case "h1":
          return styles.h1;
        case "subtitle":
          return styles.subtitle;
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
      onSelectQuote={(quote, rect) =>
        onSelect({ sectionId: TITLE_SECTION_ID, quote, rect })
      }
      onSelectionCleared={onSelectionCleared}
    />
  );
}
