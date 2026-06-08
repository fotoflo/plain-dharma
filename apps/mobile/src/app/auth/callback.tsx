/**
 * Landing screen for the magic-link deep link (`mobile://auth/callback#…`).
 *
 * The token exchange + error parsing happen in AuthProvider (its `Linking.useURL`
 * is mounted at app start, so it reliably catches the deep-link event this
 * screen would otherwise mount too late to see). On success we bounce to More
 * promptly; if AuthProvider flagged an error (expired / already-used link) we
 * show it with a way to retry.
 */

import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useMarginalia } from "@/marginalia/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

export default function AuthCallbackScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { signedIn, authError } = useMarginalia();

  // No error → land on More right away (the token exchange finishes in the
  // background); on an error we stay put and show it instead.
  useEffect(() => {
    if (authError) return;
    const t = setTimeout(() => router.replace("/more"), signedIn ? 0 : 1500);
    return () => clearTimeout(t);
  }, [authError, signedIn, router]);

  if (authError) {
    return (
      <View style={[styles.center, { backgroundColor: palette.bg }]}>
        <Text style={[styles.title, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
          Sign-in link problem
        </Text>
        <Text style={[styles.body, { color: palette.ink, fontFamily: FONTS.serif }]}>
          {authError}
        </Text>
        <Pressable
          onPress={() => router.replace("/account")}
          style={[styles.btn, { backgroundColor: palette.accentStrong }]}
          accessibilityRole="button"
        >
          <Text style={{ color: palette.onAccent, fontFamily: FONTS.serif, fontSize: 16 }}>
            Get a new link
          </Text>
        </Pressable>
      </View>
    );
  }

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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  label: { fontSize: 17 },
  title: { fontSize: 22, textAlign: "center" },
  body: { fontSize: 16, lineHeight: 24, textAlign: "center", opacity: 0.8 },
  btn: { borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
});
