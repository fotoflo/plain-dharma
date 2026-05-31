/**
 * Sentence picker — the mobile stand-in for the web's drag-to-select.
 *
 * A long-press on a section opens this sheet listing the section's sentences
 * plus a "whole passage" option. Tapping one chooses the quote to anchor; the
 * reader then writes a note / picks a color in the composer. This is the
 * closest practical creation precision RN affords (see useSuttaMarginalia for
 * the documented gap vs. the web's sub-sentence Range selection).
 */

import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

export function SentencePicker({
  visible,
  sentences,
  wholeLabel,
  onPick,
  onClose,
}: {
  visible: boolean;
  sentences: string[];
  /** The "whole passage" snippet shown as the first option. */
  wholeLabel: string;
  onPick: (quote: string) => void;
  onClose: () => void;
}) {
  const { palette } = useTheme();

  // First row = whole passage; remaining rows = individual sentences. Only show
  // the per-sentence rows when there's more than one sentence to choose from.
  const rows =
    sentences.length > 1
      ? [{ whole: true, text: wholeLabel }, ...sentences.map((s) => ({ whole: false, text: s }))]
      : [{ whole: true, text: wholeLabel }];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: palette.bg, borderColor: palette.divider }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.header, { borderColor: palette.divider }]}>
            <Text style={[styles.title, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
              Highlight a sentence
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={{ color: palette.ink, fontSize: 26, opacity: 0.5 }}>×</Text>
            </Pressable>
          </View>

          <FlatList
            data={rows}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onPick(item.text)}
                style={[styles.row, { borderColor: palette.divider }]}
              >
                {item.whole ? (
                  <Text style={[styles.wholeLabel, { color: palette.accent, fontFamily: FONTS.serif }]}>
                    The whole passage
                  </Text>
                ) : null}
                <Text
                  numberOfLines={item.whole ? 2 : undefined}
                  style={[
                    styles.sentence,
                    {
                      color: palette.ink,
                      fontFamily: item.whole ? FONTS.serifItalic : FONTS.serif,
                      opacity: item.whole ? 0.7 : 0.9,
                    },
                  ]}
                >
                  {item.text}
                </Text>
              </Pressable>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: {
    maxHeight: "70%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 8,
  },
  title: { fontSize: 20 },
  row: { paddingVertical: 12, borderBottomWidth: 1 },
  wholeLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, opacity: 0.85 },
  sentence: { fontSize: 16, lineHeight: 23 },
});
