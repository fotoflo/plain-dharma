import { DEFAULT_LOCALE, getSuttasInOrder } from "@plain-dharma/content";
import { getStrings } from "@plain-dharma/content/strings";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DecorativeBackground } from "@/components/DecorativeBackground";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { SuttaIllustration } from "@/components/SuttaIllustration";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

// Faithful port of the web HomeView (hero → newsletter → six-teachings list).
// Deferred for v1: the decorative Wash glow + NightSky star field, and the
// editorial two-row staggered illustration composition (simplified to one row).
export default function HomeScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const s = getStrings(DEFAULT_LOCALE).home;
  const suttas = getSuttasInOrder(DEFAULT_LOCALE);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <DecorativeBackground />
      <ScrollView
        style={{ backgroundColor: "transparent" }}
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 56,
          paddingHorizontal: 24,
        }}
      >
      {/* HERO */}
      <Text style={[styles.kicker, { color: palette.link }]}>
        {s.kicker.toUpperCase()}
      </Text>

      <View style={styles.heroArt}>
        {suttas.map((sutta) => (
          <Link key={sutta.slug} href={`/${sutta.slug}`} asChild>
            <Pressable accessibilityRole="link" accessibilityLabel={sutta.title}>
              <SuttaIllustration slug={sutta.slug} size={92} />
            </Pressable>
          </Link>
        ))}
      </View>

      <Text style={[styles.heroTitle, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
        {s.heroLine1}
        {"\n"}
        {s.heroLine2}
      </Text>
      <Text style={[styles.heroSubtitle, { color: palette.ink }]}>{s.heroSubtitle}</Text>

      <View style={styles.ctaRow}>
        <Link href="/read" asChild>
          <Pressable
            style={StyleSheet.flatten([styles.ctaPrimary, { backgroundColor: palette.accentStrong }])}
          >
            <Text style={{ color: palette.onAccent, fontFamily: FONTS.serif, fontSize: 15 }}>
              {s.ctaReadAll}
            </Text>
          </Pressable>
        </Link>
        <Link href="/more" asChild>
          <Pressable
            style={StyleSheet.flatten([styles.ctaSecondary, { borderColor: palette.divider }])}
          >
            <Text style={{ color: palette.ink, fontFamily: FONTS.serif, fontSize: 15 }}>
              {s.ctaDownload}
            </Text>
          </Pressable>
        </Link>
      </View>

      <Text style={[styles.blurb, { color: palette.ink, fontFamily: FONTS.serif }]}>
        {s.heroBlurb}
      </Text>

      {/* NEWSLETTER */}
      <View style={styles.section}>
        <NewsletterSignup />
      </View>

      {/* SIX TEACHINGS */}
      <Text style={[styles.listLabel, { color: palette.ink }]}>
        {s.sixTeachingsLabel.toUpperCase()}
      </Text>
      <View style={{ borderTopWidth: 1, borderColor: palette.divider, marginTop: 16 }}>
        {suttas.map((sutta) => (
          <Link key={sutta.slug} href={`/${sutta.slug}`} asChild>
            <Pressable
              style={StyleSheet.flatten([styles.row, { borderColor: palette.divider }])}
            >
              <SuttaIllustration slug={sutta.slug} size={72} />
              <View style={{ flex: 1 }}>
                <View style={styles.rowHead}>
                  <Text style={{ color: palette.accent, fontWeight: "600", fontSize: 14 }}>
                    {String(sutta.ordinal).padStart(2, "0")}
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      color: palette.ink,
                      fontFamily: FONTS.serif,
                      fontSize: 21,
                    }}
                  >
                    {sutta.title}
                  </Text>
                </View>
                <Text
                  style={{
                    color: palette.ink,
                    opacity: 0.7,
                    fontFamily: FONTS.serifItalic,
                    fontSize: 15,
                    marginTop: 4,
                  }}
                >
                  {sutta.teaser}
                </Text>
                <Text
                  style={{
                    color: palette.link,
                    fontSize: 11,
                    letterSpacing: 1,
                    marginTop: 6,
                  }}
                >
                  {(sutta.kicker_override ?? sutta.pali_name).toUpperCase()}
                </Text>
              </View>
            </Pressable>
          </Link>
        ))}
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: {
    textAlign: "center",
    fontSize: 13,
    letterSpacing: 2,
  },
  heroArt: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginVertical: 20,
  },
  heroTitle: {
    textAlign: "center",
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    textAlign: "center",
    fontSize: 17,
    lineHeight: 25,
    opacity: 0.7,
    marginTop: 14,
  },
  ctaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 24,
  },
  ctaPrimary: { borderRadius: 999, paddingHorizontal: 22, paddingVertical: 11 },
  ctaSecondary: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  blurb: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 25,
    opacity: 0.75,
    marginTop: 28,
  },
  section: { marginTop: 40 },
  listLabel: { fontSize: 12, letterSpacing: 2, opacity: 0.6, marginTop: 48 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 22,
    borderBottomWidth: 1,
  },
  rowHead: { flexDirection: "row", alignItems: "baseline", gap: 10 },
});
