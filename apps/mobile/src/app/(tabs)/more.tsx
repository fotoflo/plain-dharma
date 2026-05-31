import { DEFAULT_LOCALE } from "@plain-dharma/content";
import { getStrings } from "@plain-dharma/content/strings";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NewsletterSignup } from "@/components/NewsletterSignup";
import { OfflineDownload } from "@/components/OfflineDownload";
import { openContribute, openDonate } from "@/lib/links";
import { useTheme, type ThemeMode } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

const THEME_OPTS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Auto" },
];

// Placeholder screen surfacing the parity features (appearance / downloads /
// contribute / donate / newsletter) for verification. Final placement/chrome is
// gated.
export default function MoreScreen() {
  const { palette, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const c = getStrings(DEFAULT_LOCALE).contribute;

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
        Appearance
      </Text>
      <Text style={[styles.note, { color: palette.ink }]}>
        Light, dark, or follow your device.
      </Text>
      <View style={[styles.segRow, { borderColor: palette.divider }]}>
        {THEME_OPTS.map((opt) => {
          const active = opt.value === mode;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setMode(opt.value)}
              style={[styles.seg, active && { backgroundColor: palette.accentStrong }]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={{
                  color: active ? palette.onAccent : palette.ink,
                  opacity: active ? 1 : 0.7,
                  fontFamily: FONTS.serif,
                  fontSize: 15,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.h, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
        Download
      </Text>
      <Text style={[styles.note, { color: palette.ink }]}>
        Free, CC0 — the whole book in three formats.
      </Text>
      <Link
        href="/download"
        style={[styles.linkRow, { color: palette.link, borderColor: palette.divider, fontFamily: FONTS.serif }]}
      >
        Download the book →
      </Link>

      <Text style={[styles.h, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
        Listen offline
      </Text>
      <Text style={[styles.note, { color: palette.ink }]}>
        Save all narration to this device for plane / no-signal listening.
      </Text>
      <OfflineDownload locale={DEFAULT_LOCALE} />

      <Text style={[styles.h, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
        {c.h1}
      </Text>
      <Text style={[styles.note, { color: palette.ink }]}>{c.pHelpIntro}</Text>
      <View style={styles.bullets}>
        <Text style={[styles.bullet, { color: palette.ink, fontFamily: FONTS.serif }]}>
          <Text style={{ fontFamily: FONTS.serifBold }}>{c.liCopyEditorsLabel}</Text>
          {c.liCopyEditorsBody}
        </Text>
        <Text style={[styles.bullet, { color: palette.ink, fontFamily: FONTS.serif }]}>
          <Text style={{ fontFamily: FONTS.serifBold }}>{c.liTranslatorsLabel}</Text>
          {c.liTranslatorsBody}
        </Text>
        <Text style={[styles.bullet, { color: palette.ink, fontFamily: FONTS.serif }]}>
          <Text style={{ fontFamily: FONTS.serifBold }}>{c.liVoiceArtistsLabel}</Text>
          {c.liVoiceArtistsBody}
        </Text>
      </View>
      <Text style={[styles.note, { color: palette.ink, marginTop: 4 }]}>{c.pHelpClosing}</Text>
      <Pressable
        onPress={() => openContribute()}
        style={[styles.outlineBtn, { borderColor: palette.accent }]}
      >
        <Text style={{ color: palette.accent, fontFamily: FONTS.serif, fontSize: 16 }}>
          Get in touch →
        </Text>
      </Pressable>

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
  linkRow: { fontSize: 17, paddingVertical: 14, borderBottomWidth: 1 },
  donate: { borderRadius: 8, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  segRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 999,
    padding: 2,
    gap: 2,
    marginTop: 2,
  },
  seg: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 999,
  },
  bullets: { gap: 10, marginTop: 4 },
  bullet: { fontSize: 16, lineHeight: 24 },
  outlineBtn: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 14,
  },
});
