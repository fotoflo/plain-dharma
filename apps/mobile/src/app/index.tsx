import { DEFAULT_LOCALE, getSuttasInOrder } from "@plain-dharma/content";
import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

// Placeholder home listing — verification scaffolding only. The real home
// chrome (header, hero, illustrations) is gated until the web design settles.
export default function HomeScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const suttas = getSuttasInOrder(DEFAULT_LOCALE);

  return (
    <ScrollView
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 48,
        paddingHorizontal: 24,
      }}
    >
      <Text
        style={[styles.title, { color: palette.ink, fontFamily: FONTS.serifBold }]}
      >
        Plain Dharma
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: palette.ink, fontFamily: FONTS.serifItalic },
        ]}
      >
        Six foundational talks, in plain modern English.
      </Text>

      <View style={{ marginTop: 24 }}>
        {suttas.map((s) => (
          <Link key={s.slug} href={`/${s.slug}`} asChild>
            <Text
              style={[
                styles.item,
                {
                  color: palette.link,
                  borderColor: palette.divider,
                  fontFamily: FONTS.serif,
                },
              ]}
            >
              {s.ordinal}. {s.title}
            </Text>
          </Link>
        ))}
      </View>

      <Link href="/more" asChild>
        <Text style={[styles.more, { color: palette.link, fontFamily: FONTS.serif }]}>
          Download · Support · Newsletter →
        </Text>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 34, marginBottom: 4 },
  subtitle: { fontSize: 18 },
  item: {
    fontSize: 19,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  more: { fontSize: 16, marginTop: 28 },
});
