import { Link, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DOWNLOADS } from "@/lib/links";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

// Native mirror of the web /download landing — pick an edition, then hand off to
// the donate screen (which mirrors /download/donate).
export default function DownloadScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 48,
        paddingHorizontal: 24,
      }}
    >
      <Link href="/more" style={[styles.back, { color: palette.link, fontFamily: FONTS.serif }]}>
        ← More
      </Link>

      <Text style={[styles.kicker, { color: palette.link }]}>DOWNLOAD</Text>
      <Text style={[styles.h1, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
        Download the book
      </Text>
      <Text style={[styles.sub, { color: palette.ink, fontFamily: FONTS.serif }]}>
        Free under CC0. Pay what feels right — including nothing.
      </Text>

      <View style={styles.list}>
        {DOWNLOADS.map((d) => (
          <View key={d.format} style={[styles.card, { borderColor: palette.divider }]}>
            <View style={styles.cardHead}>
              <Text style={[styles.cardTitle, { color: palette.ink, fontFamily: FONTS.serif }]}>
                {d.title}
              </Text>
              <Text style={[styles.size, { color: palette.ink }]}>{d.size}</Text>
            </View>
            <Text style={[styles.desc, { color: palette.ink, fontFamily: FONTS.serif }]}>
              {d.description}
            </Text>
            <Pressable
              onPress={() => router.push({ pathname: "/download/donate", params: { file: d.format } })}
              style={[styles.cta, { backgroundColor: palette.accentStrong }]}
            >
              <Text style={{ color: palette.onAccent, fontFamily: FONTS.serif, fontSize: 16 }}>
                Download
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  back: { fontSize: 16, marginBottom: 20 },
  kicker: { fontSize: 12, letterSpacing: 2 },
  h1: { fontSize: 32, lineHeight: 38, marginTop: 10, marginBottom: 8 },
  sub: { fontSize: 17, lineHeight: 26, opacity: 0.8 },
  list: { marginTop: 24, gap: 16 },
  card: { borderWidth: 1, borderRadius: 10, padding: 18 },
  cardHead: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  cardTitle: { fontSize: 22 },
  size: { fontSize: 12, letterSpacing: 1, opacity: 0.55, textTransform: "uppercase" },
  desc: { fontSize: 16, lineHeight: 24, opacity: 0.8, marginTop: 6 },
  cta: { borderRadius: 999, paddingVertical: 10, paddingHorizontal: 22, alignSelf: "flex-start", marginTop: 16 },
});
