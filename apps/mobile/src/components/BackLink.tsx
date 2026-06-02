/**
 * Back affordance for pushed screens (Account, Donate, About, …). Uses a real
 * stack POP (router.back) so the transition animates as a back-gesture — the
 * current screen slides off to the right — instead of `<Link href="/more">`,
 * which is a forward *navigate* into the nested tab route and animates as a push
 * (slide in from the right, i.e. the wrong direction). Falls back to replacing
 * with `/more` when there's nothing to pop to (e.g. a cold deep link).
 */

import { useRouter } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

export function BackLink({ label = "← More" }: { label?: string }) {
  const router = useRouter();
  const { palette } = useTheme();
  return (
    <Text
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/more"))}
      accessibilityRole="button"
      style={[styles.back, { color: palette.link, fontFamily: FONTS.serif }]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  back: { fontSize: 16, marginBottom: 20 },
});
