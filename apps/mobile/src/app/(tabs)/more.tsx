import { DEFAULT_LOCALE } from "@plain-dharma/content";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NewsletterSignup } from "@/components/NewsletterSignup";
import { OfflineDownload } from "@/components/OfflineDownload";
import { DOWNLOADS, openDonate, openDownload } from "@/lib/links";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

// Placeholder screen surfacing the parity features (downloads / donate /
// newsletter) for verification. Final placement/chrome is gated.
export default function MoreScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 48,
        paddingHorizontal: 24,
      }}
    >
      <Text style={[styles.title, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
        Plain Dharma
      </Text>

      <Text style={[styles.h, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
        Download
      </Text>
      <Text style={[styles.note, { color: palette.ink }]}>
        Free, CC0 — the whole book in three formats.
      </Text>
      {DOWNLOADS.map((d) => (
        <Pressable
          key={d.format}
          onPress={() => openDownload(d.format)}
          style={[styles.row, { borderColor: palette.divider }]}
        >
          <Text style={{ color: palette.link, fontFamily: FONTS.serif, fontSize: 17 }}>
            {d.label}
          </Text>
        </Pressable>
      ))}

      <Text style={[styles.h, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
        Listen offline
      </Text>
      <Text style={[styles.note, { color: palette.ink }]}>
        Save all narration to this device for plane / no-signal listening.
      </Text>
      <OfflineDownload locale={DEFAULT_LOCALE} />

      <Text style={[styles.h, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
        Support
      </Text>
      <Pressable
        onPress={() => openDonate()}
        style={[styles.donate, { backgroundColor: palette.accentStrong }]}
      >
        <Text style={{ color: palette.onAccent, fontFamily: FONTS.serif, fontSize: 16 }}>
          Donate
        </Text>
      </Pressable>

      <Text style={[styles.h, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
        Newsletter
      </Text>
      <Text style={[styles.note, { color: palette.ink }]}>
        Occasional notes when a new talk is added.
      </Text>
      <NewsletterSignup />

      <Text style={[styles.h, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
        About
      </Text>
      <Link
        href="/about"
        style={[styles.linkRow, { color: palette.link, borderColor: palette.divider, fontFamily: FONTS.serif }]}
      >
        About Plain Dharma
      </Link>
      <Link
        href="/glossary"
        style={[styles.linkRow, { color: palette.link, borderColor: palette.divider, fontFamily: FONTS.serif }]}
      >
        Glossary
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 34, marginBottom: 8 },
  h: { fontSize: 24, marginTop: 28, marginBottom: 6 },
  note: { fontSize: 15, opacity: 0.6, marginBottom: 10 },
  row: { paddingVertical: 14, borderBottomWidth: 1 },
  linkRow: { fontSize: 17, paddingVertical: 14, borderBottomWidth: 1 },
  donate: { borderRadius: 8, paddingVertical: 14, alignItems: "center", marginTop: 4 },
});
