/**
 * Landing screen for the magic-link deep link (`mobile://auth/callback#…`).
 *
 * The token exchange itself happens in AuthProvider's `Linking.useURL`
 * listener (it sees this same URL). On success this screen just shows a brief
 * "signing you in" state and bounces to More promptly (without waiting on the
 * session) so the reader never strands on the spinner. If the link came back
 * with an error (expired / already used), we surface it with a way to retry.
 */

import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useMarginalia } from "@/marginalia/AuthContext";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

/** Pull a Supabase auth error out of the returned deep link (fragment or query). */
function authErrorFromUrl(url: string | null): string | null {
  if (!url || !url.includes("auth/callback")) return null;
  const hashIndex = url.indexOf("#");
  const fragment = hashIndex >= 0 ? url.slice(hashIndex + 1) : "";
  const fp = new URLSearchParams(fragment);
  const q = Linking.parse(url).queryParams ?? {};
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const code = fp.get("error_code") ?? pick(q.error_code) ?? "";
  const err = fp.get("error") ?? pick(q.error) ?? "";
  const desc = fp.get("error_description") ?? pick(q.error_description) ?? "";
  if (!err && !code) return null;
  if (code === "otp_expired" || /expired|invalid|already/i.test(desc)) {
    return "That sign-in link has expired or was already used. Request a fresh one below.";
  }
  return desc
    ? decodeURIComponent(desc.replace(/\+/g, " "))
    : "Sign-in didn’t complete. Please try again.";
}

export default function AuthCallbackScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { signedIn } = useMarginalia();
  const incomingUrl = Linking.useURL();
  const error = authErrorFromUrl(incomingUrl);

  // No error → land on More right away (the token exchange finishes in the
  // background); on an error we stay put and show it instead.
  useEffect(() => {
    if (error) return;
    const t = setTimeout(() => router.replace("/more"), signedIn ? 0 : 1500);
    return () => clearTimeout(t);
  }, [error, signedIn, router]);

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: palette.bg }]}>
        <Text style={[styles.title, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
          Sign-in link problem
        </Text>
        <Text style={[styles.body, { color: palette.ink, fontFamily: FONTS.serif }]}>
          {error}
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
