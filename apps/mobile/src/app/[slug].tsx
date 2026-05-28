import { DEFAULT_LOCALE, getMeta, isSuttaSlug } from "@plain-dharma/content";
import { Link, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DecorativeBackground } from "@/components/DecorativeBackground";
import { FloatingAudioPlayer } from "@/components/FloatingAudioPlayer";
import { FloatingReadingControls } from "@/components/FloatingReadingControls";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { getSuttaMarkdown } from "@/content/markdown";
import { useReadingPrefs } from "@/theme/ReadingPrefsContext";
import { useTheme } from "@/theme/ThemeContext";
import { CONTRAST_BG, FONTS } from "@/theme/tokens";

// Placeholder reading screen — verification scaffolding. The real chrome
// (reading controls, audio player, prev/next nav) is gated until web settles.
export default function SuttaScreen() {
  const { theme, palette } = useTheme();
  const { contrast } = useReadingPrefs();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const screenBg = CONTRAST_BG[theme][contrast] ?? palette.bg;

  if (!slug || !isSuttaSlug(slug)) {
    return (
      <View style={[styles.center, { backgroundColor: palette.bg }]}>
        <Text style={{ color: palette.ink, fontFamily: FONTS.serif }}>Not found.</Text>
        <Link href="/" style={{ color: palette.link, marginTop: 12 }}>
          ← Home
        </Link>
      </View>
    );
  }

  const meta = getMeta(DEFAULT_LOCALE, slug);
  const body = getSuttaMarkdown(DEFAULT_LOCALE, slug);

  return (
    <View style={{ flex: 1, backgroundColor: screenBg }}>
      <DecorativeBackground />
      <ScrollView
        style={{ backgroundColor: "transparent" }}
        contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 64,
        paddingHorizontal: 24,
      }}
    >
      <Link href="/" style={[styles.back, { color: palette.link, fontFamily: FONTS.serif }]}>
        ← All talks
      </Link>
      <Text style={[styles.kicker, { color: palette.accent, fontFamily: FONTS.serif }]}>
        {meta.kicker_override ?? meta.pali_name}
      </Text>
      <Text style={[styles.h1, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
        {meta.title}
      </Text>
      <Text
        style={[styles.subtitle, { color: palette.ink, fontFamily: FONTS.serifItalic }]}
      >
        {meta.subtitle}
      </Text>

      <View style={{ marginTop: 24 }}>
        <MarkdownRenderer>{body}</MarkdownRenderer>
      </View>
      </ScrollView>
      <FloatingReadingControls />
      <FloatingAudioPlayer locale={DEFAULT_LOCALE} slug={slug} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  back: { fontSize: 16, marginBottom: 20 },
  kicker: {
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  h1: { fontSize: 30, lineHeight: 36, marginBottom: 10 },
  subtitle: { fontSize: 18, lineHeight: 26 },
});
