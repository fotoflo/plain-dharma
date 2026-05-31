/**
 * Modal sheet to create or edit a margin note / highlight on a passage.
 *
 * Shows the anchored quote (read-only), a multiline note field, and Save /
 * Cancel. Leaving the note empty saves a plain highlight (note === null), matching
 * the web's "highlight vs note" distinction.
 */

import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

export function NoteComposer({
  visible,
  quote,
  initialNote,
  onSave,
  onCancel,
}: {
  visible: boolean;
  quote: string;
  initialNote: string | null;
  onSave: (note: string | null) => void;
  onCancel: () => void;
}) {
  const { palette } = useTheme();
  const [note, setNote] = useState(initialNote ?? "");

  function handleSave() {
    const trimmed = note.trim();
    onSave(trimmed.length ? trimmed : null);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      onShow={() => setNote(initialNote ?? "")}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kav}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: palette.bg, borderColor: palette.divider }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.title, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
              Margin note
            </Text>
            <Text
              numberOfLines={3}
              style={[styles.quote, { color: palette.ink, borderColor: palette.accent, fontFamily: FONTS.serifItalic }]}
            >
              {quote}
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="your private note… (leave empty to just highlight)"
              placeholderTextColor={palette.ink + "66"}
              multiline
              autoFocus
              style={[
                styles.input,
                { color: palette.ink, borderColor: palette.divider, fontFamily: FONTS.serif },
              ]}
            />
            <View style={styles.actions}>
              <Pressable onPress={onCancel} hitSlop={8} style={styles.cancel}>
                <Text style={{ color: palette.link, fontFamily: FONTS.serif, fontSize: 16 }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={[styles.save, { backgroundColor: palette.accentStrong }]}
              >
                <Text style={{ color: palette.onAccent, fontFamily: FONTS.serif, fontSize: 16 }}>
                  Save
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 20,
  },
  kav: { width: "100%" },
  sheet: { borderRadius: 14, borderWidth: 1, padding: 20, gap: 14 },
  title: { fontSize: 20 },
  quote: { fontSize: 16, lineHeight: 23, borderLeftWidth: 3, paddingLeft: 12, opacity: 0.85 },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: "top",
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 18 },
  cancel: { paddingVertical: 8 },
  save: { borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10 },
});
