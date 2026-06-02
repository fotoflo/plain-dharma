/**
 * Shared scaffold for the More-tab drill-down sub-screens (Account, Donate,
 * Contribute, Newsletter). Mirrors the chrome of about.tsx / glossary.tsx: a
 * decorative background, a scroll view with safe-area padding, a "‹ More" back
 * link, a kicker, and an h1 — then your content.
 */

import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackLink } from "@/components/BackLink";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

export function SubScreen({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

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
        keyboardShouldPersistTaps="handled"
      >
        <BackLink />

        <Text style={[styles.kicker, { color: palette.link }]}>{kicker.toUpperCase()}</Text>
        <Text style={[styles.h1, { color: palette.ink, fontFamily: FONTS.serifBold }]}>{title}</Text>

        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 12, letterSpacing: 2 },
  h1: { fontSize: 32, lineHeight: 38, marginTop: 10, marginBottom: 8 },
});
