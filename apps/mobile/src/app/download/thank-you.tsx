import { Link, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { deliverBookFile } from "@/lib/download-file";
import { asDownloadFormat, DOWNLOADS } from "@/lib/links";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

// Native mirror of /download/thank-you — auto-opens the share sheet for the file
// shortly after landing, with a manual button as a fallback.
export default function ThankYouScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { file } = useLocalSearchParams<{ file?: string }>();
  const slug = asDownloadFormat(file);
  const label = DOWNLOADS.find((d) => d.format === slug)?.title ?? "EPUB";
  const [busy, setBusy] = useState(false);

  const open = useCallback(async () => {
    setBusy(true);
    try {
      await deliverBookFile(slug);
    } catch {
      // User can retry with the button.
    } finally {
      setBusy(false);
    }
  }, [slug]);

  useEffect(() => {
    const t = setTimeout(() => void open(), 1000);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <ScrollView
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 48,
        paddingHorizontal: 24,
        alignItems: "center",
      }}
    >
      <Text style={[styles.kicker, { color: palette.link }]}>THANK YOU</Text>
      <Text style={[styles.h1, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
        Thank you.
      </Text>
      <Text style={[styles.sub, { color: palette.ink, fontFamily: FONTS.serif }]}>
        Your donation supports more translations, printed copies for free
        distribution, and keeping the site online.
      </Text>

      <Text style={[styles.note, { color: palette.ink, fontFamily: FONTS.serif }]}>
        Your {label} should open in a moment.
      </Text>

      <Pressable
        onPress={open}
        disabled={busy}
        style={[styles.cta, { backgroundColor: palette.accentStrong, opacity: busy ? 0.6 : 1 }]}
      >
        {busy ? (
          <ActivityIndicator color={palette.onAccent} />
        ) : (
          <Text style={{ color: palette.onAccent, fontFamily: FONTS.serif, fontSize: 16 }}>
            Open {label}
          </Text>
        )}
      </Pressable>

      <Link href="/read" style={[styles.read, { color: palette.link, fontFamily: FONTS.serif }]}>
        Read on the app →
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 12, letterSpacing: 2, marginTop: 16 },
  h1: { fontSize: 32, lineHeight: 38, marginTop: 10, marginBottom: 8, textAlign: "center" },
  sub: { fontSize: 17, lineHeight: 26, opacity: 0.8, textAlign: "center" },
  note: { fontSize: 16, opacity: 0.7, marginTop: 28, textAlign: "center" },
  cta: { borderRadius: 999, paddingVertical: 14, paddingHorizontal: 28, alignItems: "center", marginTop: 16, minWidth: 200 },
  read: { fontSize: 15, marginTop: 32 },
});
