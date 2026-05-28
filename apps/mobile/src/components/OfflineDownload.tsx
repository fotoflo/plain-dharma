import { type Locale } from "@plain-dharma/content";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useDownloads } from "@/audio/DownloadsProvider";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

const LANG_NAME: Record<Locale, string> = { en: "English", zh: "中文" };
// Approximate slow-rendition totals (see encoding notes); refine if re-encoded.
const SIZE_ESTIMATE: Record<Locale, string> = { en: "~56 MB", zh: "~78 MB" };

export function OfflineDownload({ locale }: { locale: Locale }) {
  const { palette } = useTheme();
  const { downloaded, busyLocale, progress, error, download, remove } =
    useDownloads();

  if (busyLocale === locale) {
    const pct =
      progress && progress.total > 0
        ? Math.round((progress.done / progress.total) * 100)
        : 0;
    return (
      <View style={[styles.box, { borderColor: palette.divider }]}>
        <View style={styles.rowCenter}>
          <ActivityIndicator color={palette.accent} />
          <Text style={{ color: palette.ink, fontFamily: FONTS.serif }}>
            Downloading… {progress ? `${progress.done}/${progress.total}` : ""}
          </Text>
        </View>
        <View style={[styles.barTrack, { backgroundColor: palette.divider }]}>
          <View
            style={{
              height: 4,
              borderRadius: 2,
              width: `${pct}%`,
              backgroundColor: palette.accent,
            }}
          />
        </View>
      </View>
    );
  }

  if (downloaded[locale]) {
    return (
      <View style={[styles.box, { borderColor: palette.divider }]}>
        <Text style={{ color: palette.ink, fontFamily: FONTS.serif, fontSize: 16 }}>
          ✓ {LANG_NAME[locale]} audio saved for offline
        </Text>
        <Pressable onPress={() => remove(locale)} hitSlop={8}>
          <Text style={{ color: palette.link, marginTop: 6 }}>Remove download</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <Pressable
        onPress={() => download(locale)}
        style={[styles.btn, { backgroundColor: palette.accentStrong }]}
      >
        <Text style={{ color: palette.onAccent, fontFamily: FONTS.serif, fontSize: 16 }}>
          Download all audio · {LANG_NAME[locale]} ({SIZE_ESTIMATE[locale]})
        </Text>
      </Pressable>
      {error ? <Text style={{ color: "#c0392b", marginTop: 8 }}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 8, padding: 14 },
  rowCenter: { flexDirection: "row", alignItems: "center", gap: 10 },
  barTrack: { height: 4, borderRadius: 2, marginTop: 10, overflow: "hidden" },
  btn: { borderRadius: 8, paddingVertical: 14, alignItems: "center" },
});
