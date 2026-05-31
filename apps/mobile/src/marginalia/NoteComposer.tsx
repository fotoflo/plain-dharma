/**
 * Modal sheet to create or edit a margin note / highlight on a passage.
 *
 * Shows the anchored quote (read-only), a highlight-color picker, a multiline
 * note field, and Save / Cancel. Leaving the note empty saves a plain highlight
 * (note === null), matching the web's "highlight vs note" distinction. The color
 * picker is the mobile addition over the web's single amber wash — the chosen
 * key lands in the `color` column (web tolerates unknown colors → amber).
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
import {
  DEFAULT_HIGHLIGHT_COLOR,
  HIGHLIGHT_COLOR_KEYS,
  HIGHLIGHT_COLORS,
  resolveColorKey,
  type HighlightColorKey,
} from "./colors";
import { MARGINALIA_STRINGS as t } from "./strings";

export function NoteComposer({
  visible,
  quote,
  initialNote,
  initialColor,
  onSave,
  onCancel,
}: {
  visible: boolean;
  quote: string;
  initialNote: string | null;
  /** The mark's existing color when editing; defaults to amber when creating. */
  initialColor?: string | null;
  onSave: (note: string | null, color: HighlightColorKey) => void;
  onCancel: () => void;
}) {
  const { theme, palette } = useTheme();
  const [note, setNote] = useState(initialNote ?? "");
  const [color, setColor] = useState<HighlightColorKey>(resolveColorKey(initialColor));

  // Re-seed when the modal opens for a different mark — done in the Modal's
  // onShow callback (not an effect) to match the project's existing pattern and
  // avoid setState-in-effect cascading renders.
  function reseed() {
    setNote(initialNote ?? "");
    setColor(initialColor ? resolveColorKey(initialColor) : DEFAULT_HIGHLIGHT_COLOR);
  }

  function handleSave() {
    const trimmed = note.trim();
    onSave(trimmed.length ? trimmed : null, color);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      onShow={reseed}
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
              {t.noteTitle}
            </Text>
            <Text
              numberOfLines={3}
              style={[
                styles.quote,
                {
                  color: palette.ink,
                  borderColor: palette.accent,
                  backgroundColor: HIGHLIGHT_COLORS[color][theme].wash,
                  fontFamily: FONTS.serifItalic,
                },
              ]}
            >
              {quote}
            </Text>

            {/* color picker */}
            <View style={styles.swatchRow}>
              <Text style={[styles.colorLabel, { color: palette.ink }]}>{t.colorLabel}</Text>
              <View style={styles.swatches}>
                {HIGHLIGHT_COLOR_KEYS.map((key) => {
                  const selected = key === color;
                  return (
                    <Pressable
                      key={key}
                      accessibilityLabel={key}
                      onPress={() => setColor(key)}
                      style={[
                        styles.swatch,
                        {
                          backgroundColor: HIGHLIGHT_COLORS[key][theme].swatch,
                          borderColor: selected ? palette.ink : "transparent",
                          borderWidth: selected ? 2 : 0,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t.notePlaceholderMobile}
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
                  {t.cancel}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={[styles.save, { backgroundColor: palette.accentStrong }]}
              >
                <Text style={{ color: palette.onAccent, fontFamily: FONTS.serif, fontSize: 16 }}>
                  {t.save}
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
  quote: {
    fontSize: 16,
    lineHeight: 23,
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 4,
    borderRadius: 4,
    opacity: 0.9,
  },
  swatchRow: { gap: 8 },
  colorLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 1, opacity: 0.55 },
  swatches: { flexDirection: "row", gap: 12 },
  swatch: { width: 28, height: 28, borderRadius: 14 },
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
