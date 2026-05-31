/**
 * "My notes" list — a modal sheet listing the reader's marks, mirroring the
 * web's MarginNotesPanel. Used two ways:
 *   - per-sutta on the reading screen (pass `marks` already filtered to a slug)
 *   - globally on the More tab (all marks, grouped not required)
 *
 * Each row shows the quote, the note (or a "highlight" label), and Edit /
 * Delete. Optional `onJump` lets the reading screen scroll to a mark.
 */

import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";
import type { MarginMark } from "./types";

export function MarginNotesPanel({
  visible,
  title = "Margin Notes",
  marks,
  showSlug = false,
  onClose,
  onEdit,
  onRemove,
  onJump,
}: {
  visible: boolean;
  title?: string;
  marks: MarginMark[];
  /** Show the sutta slug on each row (useful in the global list). */
  showSlug?: boolean;
  onClose: () => void;
  onEdit: (mark: MarginMark) => void;
  onRemove: (id: string) => void;
  onJump?: (mark: MarginMark) => void;
}) {
  const { palette } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: palette.bg, borderColor: palette.divider }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.header, { borderColor: palette.divider }]}>
            <Text style={[styles.title, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={{ color: palette.ink, fontSize: 26, opacity: 0.5 }}>×</Text>
            </Pressable>
          </View>

          {marks.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: palette.ink }]}>
                No margin notes yet.
              </Text>
              <Text style={[styles.emptyHint, { color: palette.ink }]}>
                Long-press a passage to highlight it or add a private note.
              </Text>
            </View>
          ) : (
            <FlatList
              data={marks}
              keyExtractor={(m) => m.id}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item: m }) => (
                <View style={styles.row}>
                  <Pressable
                    onPress={() => onJump?.(m)}
                    style={[styles.quoteWrap, { borderColor: palette.accent }]}
                  >
                    {showSlug ? (
                      <Text style={[styles.slug, { color: palette.accent, fontFamily: FONTS.serif }]}>
                        {m.slug}
                      </Text>
                    ) : null}
                    <Text
                      numberOfLines={3}
                      style={[styles.quote, { color: palette.ink, fontFamily: FONTS.serifItalic }]}
                    >
                      {m.quote}
                    </Text>
                  </Pressable>
                  {m.note ? (
                    <Text style={[styles.noteText, { color: palette.ink, fontFamily: FONTS.serif }]}>
                      {m.note}
                    </Text>
                  ) : (
                    <Text style={[styles.highlightLabel, { color: palette.ink }]}>HIGHLIGHT</Text>
                  )}
                  <View style={styles.actions}>
                    <Pressable onPress={() => onEdit(m)} hitSlop={8}>
                      <Text style={{ color: palette.link, fontFamily: FONTS.serif, fontSize: 14 }}>
                        {m.note ? "Edit note" : "Add note"}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => onRemove(m.id)} hitSlop={8}>
                      <Text style={{ color: "#c0392b", fontFamily: FONTS.serif, fontSize: 14 }}>
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: {
    maxHeight: "80%",
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
    marginBottom: 12,
  },
  title: { fontSize: 22 },
  empty: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 16, opacity: 0.6 },
  emptyHint: { fontSize: 13, opacity: 0.45, textAlign: "center" },
  row: { marginBottom: 20 },
  quoteWrap: { borderLeftWidth: 2, paddingLeft: 12 },
  slug: { fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2, opacity: 0.8 },
  quote: { fontSize: 16, lineHeight: 22, opacity: 0.85 },
  noteText: { fontSize: 15, lineHeight: 21, paddingLeft: 12, marginTop: 6, opacity: 0.8 },
  highlightLabel: { fontSize: 11, letterSpacing: 1, paddingLeft: 12, marginTop: 6, opacity: 0.4 },
  actions: { flexDirection: "row", gap: 18, paddingLeft: 12, marginTop: 8 },
});
