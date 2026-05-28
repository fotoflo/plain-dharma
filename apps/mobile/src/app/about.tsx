import { DEFAULT_LOCALE } from "@plain-dharma/content";
import { getStrings } from "@plain-dharma/content/strings";
import { Link } from "expo-router";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DecorativeBackground } from "@/components/DecorativeBackground";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

const CC0_URL = "https://creativecommons.org/publicdomain/zero/1.0/";

export default function AboutScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const s = getStrings(DEFAULT_LOCALE).about;

  const para = [styles.p, { color: palette.ink, fontFamily: FONTS.serif }];
  const h2 = [styles.h2, { color: palette.accent, fontFamily: FONTS.serifBold }];
  const linkStyle = { color: palette.link, textDecorationLine: "underline" as const };

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

        <Text style={[styles.kicker, { color: palette.link }]}>{s.kicker.toUpperCase()}</Text>
        <Text style={[styles.h1, { color: palette.ink, fontFamily: FONTS.serifBold }]}>{s.h1}</Text>

        <Text style={para}>{s.p1}</Text>
        <Text style={para}>{s.p2}</Text>
        <Text style={para}>{s.p3PreservedStripped}</Text>

        <Text style={h2}>{s.h2WhySix}</Text>
        <Text style={para}>{s.pWhySix1}</Text>
        <Text style={para}>{s.pWhySix2}</Text>

        <Text style={h2}>{s.h2License}</Text>
        <Text style={para}>
          {s.pLicense1Prefix}
          <Text style={linkStyle} onPress={() => Linking.openURL(CC0_URL)}>
            {s.pLicense1LinkText}
          </Text>
          {s.pLicense1Suffix}
        </Text>
        <Text style={para}>{s.pLicense2}</Text>

        <Text style={h2}>{s.h2GoingDeeper}</Text>
        <Text style={para}>{s.pGoingDeeperIntro}</Text>
        <View style={styles.list}>
          <Text style={para}>
            {"•  "}
            <Text style={linkStyle} onPress={() => Linking.openURL("https://suttacentral.net")}>
              {s.liSuttaCentralLink}
            </Text>
            {s.liSuttaCentralSuffix}
          </Text>
          <Text style={para}>
            {"•  "}
            <Text style={linkStyle} onPress={() => Linking.openURL("https://accesstoinsight.org")}>
              {s.liAccessToInsightLink}
            </Text>
            {s.liAccessToInsightSuffix}
          </Text>
          <Text style={para}>
            {"•  "}
            {s.liBodhiBooks}
          </Text>
        </View>

        <Text style={para}>
          {s.pGlossaryRefPrefix}
          <Link href="/glossary" style={linkStyle}>
            {s.pGlossaryRefLinkText}
          </Link>
          {s.pGlossaryRefSuffix}
        </Text>

        <Link href="/read" style={[styles.cta, { color: palette.link, fontFamily: FONTS.serif }]}>
          {s.ctaStartReading}
        </Link>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { fontSize: 16, marginBottom: 20 },
  kicker: { fontSize: 12, letterSpacing: 2 },
  h1: { fontSize: 32, lineHeight: 38, marginTop: 10, marginBottom: 8 },
  h2: { fontSize: 22, lineHeight: 28, marginTop: 28, marginBottom: 4 },
  p: { fontSize: 17, lineHeight: 27, marginTop: 14 },
  list: { marginTop: 8 },
  cta: { fontSize: 15, textAlign: "center", marginTop: 36 },
});
