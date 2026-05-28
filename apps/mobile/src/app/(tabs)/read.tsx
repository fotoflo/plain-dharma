import { DEFAULT_LOCALE, getSuttasInOrder } from "@plain-dharma/content";
import { CLOSING, DROPS, PREFACE } from "@plain-dharma/content/drops";
import { getStrings } from "@plain-dharma/content/strings";
import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DecorativeBackground } from "@/components/DecorativeBackground";
import { FloatingAudioPlayer } from "@/components/FloatingAudioPlayer";
import { FloatingReadingControls } from "@/components/FloatingReadingControls";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { getSuttaMarkdown } from "@/content/markdown";
import { useReadingPrefs } from "@/theme/ReadingPrefsContext";
import { useTheme } from "@/theme/ThemeContext";
import { CONTRAST_BG, CONTRAST_INK, FONTS } from "@/theme/tokens";

function paragraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// Combined reading of all six talks (mirrors the web ReadView): preface,
// per-sutta header + body + editorial drop, then a closing. Combined audio is
// a follow-up; per-sutta audio lives on each talk's own page.
export default function ReadScreen() {
  const { theme, palette } = useTheme();
  const { contrast, font } = useReadingPrefs();
  const insets = useSafeAreaInsets();
  const s = getStrings(DEFAULT_LOCALE).read;
  const suttas = getSuttasInOrder(DEFAULT_LOCALE);

  const screenBg = CONTRAST_BG[theme][contrast] ?? palette.bg;
  const ink = CONTRAST_INK[theme][contrast];
  const editorialFont = font === "accessible" ? FONTS.accessibleItalic : FONTS.serifItalic;

  return (
    <View style={{ flex: 1, backgroundColor: screenBg }}>
      <DecorativeBackground />
      <ScrollView
        style={{ backgroundColor: "transparent" }}
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 56,
          paddingHorizontal: 24,
        }}
      >
        <Text style={[styles.kicker, { color: palette.link }]}>{s.kicker.toUpperCase()}</Text>
        <Text style={[styles.h1, { color: ink, fontFamily: FONTS.serifBold }]}>{s.h1}</Text>
        <Text style={[styles.lead, { color: ink, fontFamily: editorialFont }]}>{s.subtitle}</Text>

        {suttas.map((meta) => (
          <View key={meta.slug} style={styles.section}>
            <View style={[styles.sectionHead, { borderColor: palette.divider }]}>
              <Text style={[styles.sectionKicker, { color: palette.link }]}>
                {String(meta.ordinal).padStart(2, "0")} ·{" "}
                {(meta.kicker_override ?? meta.pali_name).toUpperCase()}
              </Text>
              <Text style={[styles.sectionTitle, { color: ink, fontFamily: FONTS.serifBold }]}>
                {meta.title}
              </Text>
              <Text style={[styles.sectionSub, { color: ink, fontFamily: editorialFont }]}>
                {meta.subtitle}
              </Text>
            </View>

            {meta.slug === "first-talk"
              ? paragraphs(PREFACE[DEFAULT_LOCALE]).map((p, i) => (
                  <Text
                    key={i}
                    style={[styles.editorial, { color: ink, fontFamily: editorialFont }]}
                  >
                    {p}
                  </Text>
                ))
              : null}

            <View style={{ marginTop: 12 }}>
              <MarkdownRenderer>{getSuttaMarkdown(DEFAULT_LOCALE, meta.slug)}</MarkdownRenderer>
            </View>

            <View style={styles.drop}>
              <View style={[styles.dropRule, { backgroundColor: palette.accent }]} />
              <Text style={[styles.dropText, { color: ink, fontFamily: editorialFont }]}>
                {DROPS[DEFAULT_LOCALE][meta.slug]}
              </Text>
            </View>

            <Link href={`/${meta.slug}`} style={[styles.openLink, { color: palette.link }]}>
              {s.openOnOwnPage} →
            </Link>
          </View>
        ))}

        <View style={styles.closing}>
          {paragraphs(CLOSING[DEFAULT_LOCALE]).map((p, i) => (
            <Text key={i} style={[styles.editorial, { color: ink, fontFamily: editorialFont }]}>
              {p}
            </Text>
          ))}
        </View>
      </ScrollView>
      <FloatingReadingControls />
      <FloatingAudioPlayer locale={DEFAULT_LOCALE} combined />
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { textAlign: "center", fontSize: 12, letterSpacing: 2 },
  h1: { textAlign: "center", fontSize: 32, lineHeight: 38, marginTop: 12 },
  lead: { textAlign: "center", fontSize: 17, lineHeight: 25, opacity: 0.75, marginTop: 12 },
  section: { marginTop: 44 },
  sectionHead: { borderTopWidth: 1, paddingTop: 22 },
  sectionKicker: { fontSize: 11, letterSpacing: 1.5 },
  sectionTitle: { fontSize: 26, lineHeight: 32, marginTop: 8 },
  sectionSub: { fontSize: 16, lineHeight: 24, opacity: 0.75, marginTop: 8 },
  editorial: { fontSize: 16, lineHeight: 26, marginTop: 14 },
  drop: { alignItems: "center", marginTop: 20 },
  dropRule: { width: 40, height: 2, borderRadius: 1, marginBottom: 12 },
  dropText: { fontSize: 15, lineHeight: 23, textAlign: "center", paddingHorizontal: 12 },
  openLink: { fontSize: 13, marginTop: 18, textAlign: "right" },
  closing: { marginTop: 52 },
});
