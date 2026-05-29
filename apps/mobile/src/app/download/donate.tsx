import * as Linking from "expo-linking";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { deliverBookFile } from "@/lib/download-file";
import { asDownloadFormat, DOWNLOADS } from "@/lib/links";
import { SITE_ORIGIN } from "@/lib/site";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

// Center-bias picks the middle option; $7 is the most-clicked tier. The reason
// copy converts better than naked numbers. Mirrors the web DonateForm.
const PRESETS = [
  { cents: 300, label: "$3", reason: "Matches the Amazon price." },
  { cents: 700, label: "$7", reason: "Helps cover hosting and future translations." },
  {
    cents: 1500,
    label: "$15",
    reason: "Funds printed copies given freely at temples, retreats, and hospices.",
  },
] as const;

export default function DonateScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { file } = useLocalSearchParams<{ file?: string }>();
  const slug = asDownloadFormat(file);
  const label = DOWNLOADS.find((d) => d.format === slug)?.title ?? "EPUB";

  const [selectedCents, setSelectedCents] = useState(700);
  const [customDollars, setCustomDollars] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The in-app browser (openBrowserAsync) doesn't intercept the return itself,
  // so we listen for the link the OS hands back once Stripe finishes — either
  // the https Universal/App Link (https://plaindharma.com/download/return?to=…)
  // or the custom-scheme fallback (mobile://download/donate?to=…) the return
  // page bounces to. We match the raw `to` query and navigate ourselves;
  // dismissBrowser closes the lingering iOS browser (no-op on Android).
  useEffect(() => {
    const handle = (url: string) => {
      if (!url.includes("download")) return;
      if (url.includes("to=cancel")) {
        WebBrowser.dismissBrowser().catch(() => {});
        setCancelled(true);
      } else if (url.includes("to=thankyou")) {
        WebBrowser.dismissBrowser().catch(() => {});
        router.replace({ pathname: "/download/thank-you", params: { file: slug } });
      }
    };
    const sub = Linking.addEventListener("url", (e) => handle(e.url));
    Linking.getInitialURL().then((u) => u && handle(u));
    return () => sub.remove();
  }, [slug, router]);

  function effectiveCents(): number {
    if (customDollars.trim() !== "") {
      const parsed = Number(customDollars.replace(/[^0-9.]/g, ""));
      return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : 0;
    }
    return selectedCents;
  }

  const cents = effectiveCents();
  const donateLabel =
    cents < 100 ? "Donate" : `Donate $${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)} & download`;

  async function handleDonate() {
    if (cents < 100) {
      setError(
        "Minimum donation is $1. Use the free download link below if you'd like to skip donating."
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    setCancelled(false);
    try {
      const res = await fetch(`${SITE_ORIGIN}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: cents, file: slug, platform: "mobile" }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? `HTTP ${res.status}`);
      // Open Stripe in a plain in-app browser (no auth-session consent dialog).
      // The return is handled by the deep-link listener above.
      await WebBrowser.openBrowserAsync(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    setError(null);
    try {
      await deliverBookFile(slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 48,
        paddingHorizontal: 24,
      }}
    >
      <Link href="/download" style={[styles.back, { color: palette.link, fontFamily: FONTS.serif }]}>
        ← Editions
      </Link>

      <Text style={[styles.kicker, { color: palette.link }]}>PAY WHAT FEELS RIGHT</Text>
      <Text style={[styles.h1, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
        Read it. Pay what feels right.
      </Text>
      <Text style={[styles.sub, { color: palette.ink, fontFamily: FONTS.serif }]}>
        Downloading the {label} edition. Plain Dharma is free under CC0 — if you
        do donate, it supports more translations, printed copies, and keeping the
        site online.
      </Text>

      {cancelled && (
        <View style={[styles.banner, { backgroundColor: palette.accent + "1A" }]}>
          <Text style={{ color: palette.ink, fontFamily: FONTS.serif }}>
            Payment was cancelled. You can try a different amount or take the free
            download below.
          </Text>
        </View>
      )}

      <View style={styles.presets}>
        {PRESETS.map((p) => {
          const active = customDollars.trim() === "" && selectedCents === p.cents;
          return (
            <Pressable
              key={p.cents}
              onPress={() => {
                setSelectedCents(p.cents);
                setCustomDollars("");
              }}
              style={[
                styles.preset,
                { borderColor: active ? palette.accent : palette.divider },
                active && { backgroundColor: palette.accent + "1A" },
              ]}
            >
              <Text style={[styles.presetAmount, { color: palette.ink, fontFamily: FONTS.serif }]}>
                {p.label}
              </Text>
              <Text style={[styles.presetReason, { color: palette.ink, fontFamily: FONTS.serif }]}>
                {p.reason}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.customRow}>
        <Text style={{ color: palette.ink, opacity: 0.7, fontFamily: FONTS.serif }}>
          Or another amount —
        </Text>
        <Text style={{ color: palette.ink, fontFamily: FONTS.serif, fontSize: 18 }}>$</Text>
        <TextInput
          value={customDollars}
          onChangeText={setCustomDollars}
          placeholder="0"
          placeholderTextColor={palette.ink + "66"}
          keyboardType="decimal-pad"
          style={[styles.customInput, { color: palette.ink, borderColor: palette.divider, fontFamily: FONTS.serif }]}
        />
      </View>

      {error && (
        <View style={[styles.banner, { backgroundColor: "#c0392b1A" }]}>
          <Text style={{ color: "#c0392b" }}>{error}</Text>
        </View>
      )}

      <Pressable
        onPress={handleDonate}
        disabled={submitting}
        style={[styles.donate, { backgroundColor: palette.accentStrong, opacity: submitting ? 0.6 : 1 }]}
      >
        <Text style={{ color: palette.onAccent, fontFamily: FONTS.serif, fontSize: 16 }}>
          {submitting ? "Opening Stripe…" : donateLabel}
        </Text>
      </Pressable>

      <Pressable onPress={handleSkip} hitSlop={8} style={styles.skip}>
        <Text style={{ color: palette.link, fontFamily: FONTS.serif }}>
          or skip and download for free
        </Text>
      </Pressable>

      <Text style={[styles.fine, { color: palette.ink, fontFamily: FONTS.serif }]}>
        Payment is processed by Stripe. We don&rsquo;t store your card. The
        download works the same whether you donate or not — this is a nudge, not
        a gate.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  back: { fontSize: 16, marginBottom: 20 },
  kicker: { fontSize: 12, letterSpacing: 2 },
  h1: { fontSize: 30, lineHeight: 36, marginTop: 10, marginBottom: 8 },
  sub: { fontSize: 16, lineHeight: 25, opacity: 0.8 },
  banner: { borderRadius: 8, padding: 14, marginTop: 20 },
  presets: { marginTop: 24, gap: 12 },
  preset: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 14 },
  presetAmount: { fontSize: 22 },
  presetReason: { fontSize: 14, opacity: 0.7, marginTop: 2 },
  customRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18 },
  customInput: {
    minWidth: 90,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 18,
  },
  donate: { borderRadius: 999, paddingVertical: 14, alignItems: "center", marginTop: 24 },
  skip: { alignItems: "center", paddingVertical: 14 },
  fine: { fontSize: 12, opacity: 0.5, lineHeight: 18, marginTop: 10 },
});
