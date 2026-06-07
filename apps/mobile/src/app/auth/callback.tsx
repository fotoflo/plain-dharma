/**
 * Landing screen for the magic-link deep link (`mobile://auth/callback#…`).
 *
 * The token exchange itself happens in AuthProvider's `Linking.useURL`
 * listener (it sees this same URL). This screen just shows a brief "signing
 * you in" state and bounces to More promptly (without waiting on the session),
 * so the reader lands somewhere sensible instead of on a raw callback URL — and
 * never strands on the spinner if the link is stale.
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

  // The token exchange runs in the background in AuthProvider. Land the reader on
  // More right away rather than gating forever on `signedIn` — a stale or
  // already-used link (e.g. a deleted user) would otherwise leave this spinner
  // stuck. The More tab reactively reflects the session once it resolves.
  useEffect(() => {
    const t = setTimeout(() => router.replace("/more"), signedIn ? 0 : 1500);
    return () => clearTimeout(t);
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
