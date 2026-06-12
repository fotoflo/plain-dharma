/**
 * "Tap a paragraph → see the source" bottom sheet: the root Pāli for the
 * tapped passage beside Bhikkhu Sujato's canonical translation, with full
 * provenance (mirrors the web /[slug]/source three-column view, one row at a
 * time). Data comes from @plain-dharma/content/source — the same alignment
 * the web page renders — so the two surfaces can never drift.
 */

import {
  PALI_LICENSE,
  PALI_SOURCE,
  SUJATO_LICENSE,
  suttaCentralUrl,
  type SourceRow,
} from "@plain-dharma/content/source";
import type { SuttaSlug } from "@plain-dharma/content";
import * as WebBrowser from "expo-web-browser";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SITE_ORIGIN } from "@/lib/site";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

export function SourcePeek({
  row,
  slug,
  onClose,
}: {
  /** The matched source row; null hides the sheet. */
  row: SourceRow | null;
  slug: SuttaSlug;
  onClose: () => void;
}) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const src = PALI_SOURCE[slug];

  return (
    <Modal visible={row != null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: palette.bg, borderColor: palette.divider }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.header, { borderColor: palette.divider }]}>
            <Text style={[styles.kicker, { color: palette.link }]}>
              {src.ref.toUpperCase()} · {row?.ref ?? ""}
            </Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
              <Text style={{ color: palette.link, fontFamily: FONTS.serif, fontSize: 16 }}>
                Close
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.label, { color: palette.ink }]}>PĀLI · {src.name}</Text>
            <Text style={[styles.pali, { color: palette.ink, fontFamily: FONTS.serifItalic }]}>
              {row?.pali}
            </Text>

            <View style={[styles.rule, { backgroundColor: palette.divider }]} />

            <Text style={[styles.label, { color: palette.ink }]}>
              {SUJATO_LICENSE.translator.toUpperCase()}
            </Text>
            <Text style={[styles.trad, { color: palette.ink, fontFamily: FONTS.serif }]}>
              {row?.trad}
            </Text>

            <Pressable
              onPress={() => void WebBrowser.openBrowserAsync(`${SITE_ORIGIN}/${slug}/source`)}
              hitSlop={6}
              style={{ marginTop: 20 }}
            >
              <Text style={{ color: palette.link, fontFamily: FONTS.serif, fontSize: 15 }}>
                Full side-by-side source view →
              </Text>
            </Pressable>

            <Text
              style={[styles.fine, { color: palette.ink, fontFamily: FONTS.serif }]}
              onPress={() => void WebBrowser.openBrowserAsync(suttaCentralUrl(slug))}
            >
              Pāli: {PALI_LICENSE.edition} ({PALI_LICENSE.license}). English:{" "}
              {SUJATO_LICENSE.translator}, {SUJATO_LICENSE.license}, via {SUJATO_LICENSE.via}.
            </Text>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: {
    maxHeight: "75%",
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 12,
    marginBottom: 14,
  },
  kicker: { fontSize: 12, letterSpacing: 2 },
  label: { fontSize: 10, letterSpacing: 1.6, opacity: 0.55, marginBottom: 6 },
  pali: { fontSize: 16, lineHeight: 25 },
  trad: { fontSize: 16, lineHeight: 25 },
  rule: { height: StyleSheet.hairlineWidth, marginVertical: 16 },
  fine: { fontSize: 11, lineHeight: 17, opacity: 0.5, marginTop: 14 },
});
