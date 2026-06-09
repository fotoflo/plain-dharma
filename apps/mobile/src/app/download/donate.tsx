import * as Linking from "expo-linking";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAudioPanel } from "@/audio/AudioPanelContext";
import { useDownloads } from "@/audio/DownloadsProvider";
import { useLocale } from "@/i18n/LocaleContext";
import { logEvent } from "@/lib/analytics";
import { deliverBookFile } from "@/lib/download-file";
import { asDownloadFormat, DOWNLOADS } from "@/lib/links";
import { SITE_ORIGIN } from "@/lib/site";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

// $15 is the pre-selected anchor (middle tier). The reason copy converts better
// than naked numbers. Mirrors the web DonateForm. $5 ≈ the Amazon ebook price.
const PRESETS = [
  { cents: 500, label: "$5", reason: "About the Amazon ebook price." },
  {
    cents: 1500,
    label: "$15",
    reason: "Funds printed copies given freely at temples, retreats, and hospices.",
  },
  { cents: 3000, label: "$30", reason: "Sponsors a temple print run and future translations." },
] as const;

export default function DonateScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { locale } = useLocale();
  const { download } = useDownloads();
  const { setAudioOpen } = useAudioPanel();

  const { file, ref } = useLocalSearchParams<{ file?: string; ref?: string }>();
  const slug = asDownloadFormat(file);
  const label = DOWNLOADS.find((d) => d.format === slug)?.title ?? "PDF";
  // Arrived from the listen modal: the pay/free choice gates *offline listening*
  // (in-app audio caching), and a separate CTA downloads the audiobook file.
  const fromListen = ref === "listen";

  const [selectedCents, setSelectedCents] = useState(1500);
  const [customDollars, setCustomDollars] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dlProgress, setDlProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Funnel analytics: who arrived here and for which edition (anonymous,
  // production-only; no-op in dev). Mirrors the web donate-page event.
  useEffect(() => {
    void logEvent("donate_view", { ref: ref ?? "direct", file: slug });
  }, [ref, slug]);

  // Kick off the in-app offline-audio download (runs globally in
  // DownloadsProvider), ask the listen panel to reopen, and bounce back to the
  // Read tab — so the reader lands on the player with the download in progress.
  const startOfflineListen = useCallback(() => {
    void download(locale);
    setAudioOpen(true);
    router.replace("/read");
  }, [download, locale, setAudioOpen, router]);

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
        // Paid for offline listening → start the cache + return to the player;
        // otherwise it's a file purchase → the thank-you auto-download screen.
        if (fromListen) startOfflineListen();
        else router.replace({ pathname: "/download/thank-you", params: { file: slug } });
      }
    };
    const sub = Linking.addEventListener("url", (e) => handle(e.url));
    Linking.getInitialURL().then((u) => u && handle(u));
    return () => sub.remove();
  }, [slug, router, fromListen, startOfflineListen]);

  function effectiveCents(): number {
    if (customDollars.trim() !== "") {
      const parsed = Number(customDollars.replace(/[^0-9.]/g, ""));
      return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : 0;
    }
    return selectedCents;
  }

  const cents = effectiveCents();
  const money = (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
  const donateLabel =
    cents < 100
      ? "Donate"
      : fromListen
        ? `Donate $${money} & listen offline`
        : `Donate $${money} & download`;

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

  // Downloads the actual book/audiobook FILE (to the share sheet) with a
  // progress bar. Used for the non-listen free download and the listen screen's
  // separate "Download the audiobook" CTA.
  async function downloadFile() {
    if (downloading) return;
    setError(null);
    setDownloading(true);
    setDlProgress(0);
    try {
      await deliverBookFile(slug, setDlProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloading(false);
      setDlProgress(null);
    }
  }

  const dlPct =
    downloading && dlProgress != null ? ` ${Math.round(dlProgress * 100)}%` : "";
  const skipLabel = downloading
    ? `Downloading…${dlPct}`
    : "or skip and download for free";
  const audiobookLabel = downloading
    ? `Downloading…${dlPct}`
    : "Download the audiobook";

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
        {fromListen
          ? "Save the narration to listen offline. Plain Dharma is free under CC0 — paying is a nudge, not a gate; it funds more translations, printed copies, and hosting."
          : `Downloading the ${label} edition. Plain Dharma is free under CC0 — if you do donate, it supports more translations, printed copies, and keeping the site online.`}
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

      {fromListen ? (
        <>
          {/* Group 1 — cache the narration to play in the app's own player. */}
          <Text style={[styles.groupLabel, { color: palette.link }]}>
            LISTEN OFFLINE IN THE APP
          </Text>
          <Pressable
            onPress={handleDonate}
            disabled={submitting}
            style={[
              styles.donate,
              { backgroundColor: palette.accentStrong, marginTop: 8, opacity: submitting ? 0.6 : 1 },
            ]}
          >
            <Text style={{ color: palette.onAccent, fontFamily: FONTS.serif, fontSize: 16 }}>
              {submitting ? "Opening Stripe…" : donateLabel}
            </Text>
          </Pressable>
          <Pressable onPress={startOfflineListen} hitSlop={8} style={styles.skip}>
            <Text style={{ color: palette.link, fontFamily: FONTS.serif }}>
              or listen offline for free
            </Text>
          </Pressable>
          <Text style={[styles.caption, { color: palette.ink }]}>
            Saves the narration in the app so you can play it without a connection.
          </Text>

          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: palette.divider }]} />
            <Text style={[styles.orText, { color: palette.ink, fontFamily: FONTS.serif }]}>
              or
            </Text>
            <View style={[styles.orLine, { backgroundColor: palette.divider }]} />
          </View>

          {/* Group 2 — download the M4B *file* to use in another player. */}
          <Text style={[styles.groupLabel, { color: palette.link, marginTop: 0 }]}>
            GET THE AUDIOBOOK FILE
          </Text>
          <Pressable
            onPress={downloadFile}
            disabled={downloading}
            style={[styles.audiobook, { borderColor: palette.accent }]}
            accessibilityRole="button"
          >
            <Text style={{ color: palette.accent, fontFamily: FONTS.serif, fontSize: 16 }}>
              {audiobookLabel}
            </Text>
          </Pressable>
          <Text style={[styles.caption, { color: palette.ink }]}>
            M4B for Apple Books, Files, or any audiobook player.
          </Text>
        </>
      ) : (
        <>
          <Pressable
            onPress={handleDonate}
            disabled={submitting}
            style={[styles.donate, { backgroundColor: palette.accentStrong, opacity: submitting ? 0.6 : 1 }]}
          >
            <Text style={{ color: palette.onAccent, fontFamily: FONTS.serif, fontSize: 16 }}>
              {submitting ? "Opening Stripe…" : donateLabel}
            </Text>
          </Pressable>
          <Pressable onPress={downloadFile} hitSlop={8} disabled={downloading} style={styles.skip}>
            <Text style={{ color: palette.link, fontFamily: FONTS.serif }}>{skipLabel}</Text>
          </Pressable>
        </>
      )}

      {downloading && dlProgress != null ? (
        <View style={[styles.progressTrack, { backgroundColor: palette.divider }]}>
          <View
            style={{
              height: 4,
              borderRadius: 2,
              width: `${Math.round(dlProgress * 100)}%`,
              backgroundColor: palette.accent,
            }}
          />
        </View>
      ) : null}

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
  skip: { alignItems: "center", paddingVertical: 16, marginTop: 4 },
  groupLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "600",
    opacity: 0.8,
    marginTop: 28,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.55,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 8,
  },
  orRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 26 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, opacity: 0.7 },
  orText: { fontSize: 13, opacity: 0.5 },
  audiobook: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: -4,
    marginBottom: 6,
  },
  fine: { fontSize: 12, opacity: 0.5, lineHeight: 18, marginTop: 10 },
});
