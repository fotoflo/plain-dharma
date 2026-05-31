import { DEFAULT_LOCALE, getMeta, isSuttaSlug } from "@plain-dharma/content";
import { Link, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAudio } from "@/audio/AudioProvider";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { FloatingControls } from "@/components/FloatingControls";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { getSuttaMarkdown, splitSections } from "@/content/markdown";
import { useReadingPrefs } from "@/theme/ReadingPrefsContext";
import { useTheme } from "@/theme/ThemeContext";
import { CONTRAST_BG, FONTS } from "@/theme/tokens";

export default function SuttaScreen() {
  const { theme, palette } = useTheme();
  const { contrast } = useReadingPrefs();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { sections: audioSections, index } = useAudio();

  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});
  const didMount = useRef(false);

  // Active audio section, with the combined "slug--section" prefix stripped.
  const activeId = audioSections[index]?.id?.split("--").pop();

  const recordPos = useCallback((id: string) => (e: LayoutChangeEvent) => {
    positions.current[id] = e.nativeEvent.layout.y;
  }, []);

  // Follow the audio: scroll to the section it just moved to. Skip the first
  // run so we don't yank the page on load.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (!activeId) return;
    const y = positions.current[activeId];
    if (y != null) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
    }
  }, [activeId]);

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
  const contentSections = splitSections(getSuttaMarkdown(DEFAULT_LOCALE, slug));

  return (
    <View style={{ flex: 1, backgroundColor: screenBg }}>
      <DecorativeBackground />
      <ScrollView
        ref={scrollRef}
        style={{ backgroundColor: "transparent" }}
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 96,
          paddingHorizontal: 24,
        }}
      >
        <Link href="/" style={[styles.back, { color: palette.link, fontFamily: FONTS.serif }]}>
          ← All talks
        </Link>

        <View onLayout={recordPos("title")} style={{ marginBottom: 8 }}>
          <Text style={[styles.kicker, { color: palette.accent, fontFamily: FONTS.serif }]}>
            {meta.kicker_override ?? meta.pali_name}
          </Text>
          <Text style={[styles.h1, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
            {meta.title}
          </Text>
          <Text style={[styles.subtitle, { color: palette.ink, fontFamily: FONTS.serifItalic }]}>
            {meta.subtitle}
          </Text>
        </View>

        {contentSections.map((sec) => (
          <View key={sec.id} onLayout={recordPos(sec.id)}>
            <MarkdownRenderer>{sec.markdown}</MarkdownRenderer>
          </View>
        ))}
      </ScrollView>
      <FloatingControls locale={DEFAULT_LOCALE} slug={slug} />
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
