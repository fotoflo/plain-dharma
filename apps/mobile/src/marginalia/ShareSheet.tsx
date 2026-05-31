/**
 * Passage share sheet — the mobile counterpart of the web's ShareDialog.
 *
 * Same three affordances, same order: Copy link, Copy passage, native Share.
 *  - Copy uses expo-clipboard's `setStringAsync` (the one native module this
 *    feature adds — see the rebuild note in the PR).
 *  - Native share uses React Native's built-in `Share.share({ message, url })`
 *    (no extra dependency), passing the same `“quote”\n\n title \n url` message
 *    the web hands to `navigator.share`.
 *
 * No OG-card preview row: RN can't read the remote page's meta tags the way the
 * web ShareDialog does, and the link unfurls to the same plaindharma.com card
 * once opened — so we surface the link + quote and skip the preview.
 */

import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Modal, Pressable, Share, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";
import { MARGINALIA_STRINGS as t } from "./strings";
import type { SharePayload } from "./share";

export function ShareSheet({
  visible,
  payload,
  onClose,
}: {
  visible: boolean;
  payload: SharePayload | null;
  onClose: () => void;
}) {
  const { palette } = useTheme();
  const [copied, setCopied] = useState<"link" | "passage" | null>(null);

  async function copy(what: "link" | "passage") {
    if (!payload) return;
    const text = what === "link" ? payload.url : payload.passageText;
    try {
      await Clipboard.setStringAsync(text);
      setCopied(what);
    } catch {
      /* clipboard unavailable — leave the label unchanged */
    }
  }

  async function nativeShare() {
    if (!payload) return;
    try {
      await Share.share({ message: payload.passageText, url: payload.url, title: payload.title });
    } catch {
      /* user dismissed or share failed — nothing to do */
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => setCopied(null)}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: palette.bg, borderColor: palette.divider }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
              {t.shareTitle}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={{ color: palette.ink, fontSize: 26, opacity: 0.5 }}>×</Text>
            </Pressable>
          </View>

          <Text style={[styles.intro, { color: palette.ink }]}>{t.shareIntro}</Text>

          {payload ? (
            <Text
              numberOfLines={3}
              style={[styles.quote, { color: palette.ink, borderColor: palette.accent, fontFamily: FONTS.serifItalic }]}
            >
              {payload.quote}
            </Text>
          ) : null}

          {payload ? (
            <Text numberOfLines={1} style={[styles.url, { color: palette.ink, borderColor: palette.divider }]}>
              {payload.url}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={() => copy("link")}
              style={[styles.primaryBtn, { backgroundColor: palette.accentStrong }]}
            >
              <Text style={{ color: palette.onAccent, fontFamily: FONTS.serif, fontSize: 15 }}>
                {copied === "link" ? t.copied : t.copyLink}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => copy("passage")}
              style={[styles.outlineBtn, { borderColor: palette.accent }]}
            >
              <Text style={{ color: palette.accent, fontFamily: FONTS.serif, fontSize: 15 }}>
                {copied === "passage" ? t.copied : t.copyPassage}
              </Text>
            </Pressable>
            <Pressable onPress={nativeShare} style={[styles.outlineBtn, { borderColor: palette.accent }]}>
              <Text style={{ color: palette.accent, fontFamily: FONTS.serif, fontSize: 15 }}>
                {t.shareNative}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 20 },
  sheet: { borderRadius: 14, borderWidth: 1, padding: 20, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20 },
  intro: { fontSize: 13, opacity: 0.6, lineHeight: 19 },
  quote: { fontSize: 16, lineHeight: 23, borderLeftWidth: 3, paddingLeft: 12, opacity: 0.85 },
  url: { fontSize: 12, opacity: 0.6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  primaryBtn: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  outlineBtn: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
});
