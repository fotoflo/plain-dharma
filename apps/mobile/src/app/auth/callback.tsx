/**
 * Landing screen for the magic-link deep link (`mobile://auth/callback#…`).
 *
 * The token exchange itself happens in AuthProvider's `Linking.useURL`
 * listener (it sees this same URL). This screen just shows a brief "signing
 * you in" state and bounces to More once a session exists, so the reader lands
 * somewhere sensible instead of on a raw callback URL.
 */

import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useMarginalia } from "@/marginalia/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

export default function AuthCallbackScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { signedIn } = useMarginalia();

  useEffect(() => {
    if (signedIn) router.replace("/more");
  }, [signedIn, router]);

  return (
    <View style={[styles.center, { backgroundColor: palette.bg }]}>
      <ActivityIndicator color={palette.accent} />
      <Text style={[styles.label, { color: palette.ink, fontFamily: FONTS.serif }]}>
        Signing you in…
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  label: { fontSize: 17 },
});
