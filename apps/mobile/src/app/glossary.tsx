import { DEFAULT_LOCALE } from "@plain-dharma/content";
import { GLOSSARY } from "@plain-dharma/content/glossary";
import { getStrings } from "@plain-dharma/content/strings";
import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DecorativeBackground } from "@/components/DecorativeBackground";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

export default function GlossaryScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const s = getStrings(DEFAULT_LOCALE);
  const entries = GLOSSARY[DEFAULT_LOCALE];

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <DecorativeBackground />
      <ScrollView
        style={{ backgroundColor: "transparent" }}
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 48,
          paddingHorizontal: 24,
        }}
      >
        <Link href="/more" style={[styles.back, { color: palette.link, fontFamily: FONTS.serif }]}>
          ← More
        </Link>

        <Text style={[styles.kicker, { color: palette.link }]}>
          {s.nav.glossary.toUpperCase()}
        </Text>
        <Text style={[styles.h1, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
          {s.nav.glossary}
        </Text>
        <Text style={[styles.subtitle, { color: palette.ink, fontFamily: FONTS.serifItalic }]}>
          {s.glossary.subtitle}
        </Text>

        <View style={{ marginTop: 20, borderTopWidth: 1, borderColor: palette.divider }}>
          {entries.map((entry) => (
            <View key={entry.term} style={[styles.entry, { borderColor: palette.divider }]}>
              <Text style={[styles.term, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
                {entry.term}
              </Text>
              {entry.pali ? (
                <Text style={[styles.pali, { color: palette.ink, fontFamily: FONTS.serifItalic }]}>
                  {entry.pali}
                </Text>
              ) : null}
              <Text style={[styles.def, { color: palette.ink, fontFamily: FONTS.serif }]}>
                {entry.definition}
              </Text>
            </View>
          ))}
        </View>

        <Link href="/read" style={[styles.cta, { color: palette.link, fontFamily: FONTS.serif }]}>
          Read all six talks →
        </Link>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { fontSize: 16, marginBottom: 20 },
  kicker: { fontSize: 12, letterSpacing: 2 },
  h1: { fontSize: 32, lineHeight: 38, marginTop: 10 },
  subtitle: { fontSize: 17, lineHeight: 25, opacity: 0.75, marginTop: 10 },
  entry: { paddingVertical: 18, borderBottomWidth: 1 },
  term: { fontSize: 20 },
  pali: { fontSize: 13, opacity: 0.7, marginTop: 2 },
  def: { fontSize: 16, lineHeight: 25, marginTop: 6 },
  cta: { fontSize: 15, textAlign: "center", marginTop: 36 },
});
