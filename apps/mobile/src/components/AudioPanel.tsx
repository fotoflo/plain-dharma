import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";

import { type Locale } from "@plain-dharma/content";
import { getStrings } from "@plain-dharma/content/strings";

import { useAudio } from "@/audio/AudioProvider";
import { useDownloads } from "@/audio/DownloadsProvider";
import { sectionDuration } from "@/audio/manifest";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

function ProgressBar({
  position,
  duration,
  fill,
  track,
  onSeek,
}: {
  position: number;
  duration: number;
  fill: string;
  track: string;
  onSeek: (sec: number) => void;
}) {
  const widthRef = useRef(0);
  const pct = duration > 0 ? Math.min(1, position / duration) : 0;
  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
  };
  const onPress = (e: GestureResponderEvent) => {
    const w = widthRef.current;
    if (w > 0 && duration > 0) onSeek((e.nativeEvent.locationX / w) * duration);
  };
  return (
    <Pressable onLayout={onLayout} onPress={onPress} style={styles.scrubHit}>
      <View style={[styles.scrubTrack, { backgroundColor: track }]}>
        <View
          style={{ height: 4, borderRadius: 2, width: `${pct * 100}%`, backgroundColor: fill }}
        />
      </View>
    </Pressable>
  );
}

// "Download for offline" → the donate gate (pay-or-free) for offline listening.
// The actual in-app audio caching is kicked off from that screen and runs here
// in DownloadsProvider, so this control shows live progress on return and hides
// once the locale is cached. App-Store-safe: any payment happens off-app, and
// the free path is always offered.
function DownloadControl({ locale }: { locale: Locale }) {
  const { palette } = useTheme();
  const router = useRouter();
  const { downloaded, busyLocale, progress } = useDownloads();
  const s = getStrings(locale).audio;
  // Once cached, show a clear confirmation (not a tappable button, and don't
  // just vanish — that left readers unsure whether it had downloaded).
  if (downloaded[locale]) {
    return (
      <View style={[styles.dlBtn, { borderColor: palette.divider, opacity: 0.9 }]}>
        <Ionicons name="checkmark-circle" size={16} color={palette.accent} />
        <Text style={[styles.dlText, { color: palette.ink }]}>{s.savedOffline}</Text>
      </View>
    );
  }
  const busy = busyLocale === locale;
  return (
    <Pressable
      onPress={() => {
        if (!busy)
          router.push({
            pathname: "/download/donate",
            params: { file: "m4b", ref: "listen" },
          });
      }}
      disabled={busy}
      style={[styles.dlBtn, { borderColor: palette.divider }]}
      accessibilityRole="button"
      accessibilityLabel={s.downloadForOffline}
    >
      {busy ? (
        <ActivityIndicator size="small" color={palette.accent} />
      ) : (
        <Ionicons name="arrow-down-circle-outline" size={16} color={palette.accent} />
      )}
      <Text style={[styles.dlText, { color: busy ? palette.ink : palette.accent }]}>
        {busy
          ? `${s.downloading}${progress ? ` ${progress.done}/${progress.total}` : "…"}`
          : s.downloadForOffline}
      </Text>
    </Pressable>
  );
}

export function AudioPanel({ locale }: { locale: Locale }) {
  const { palette } = useTheme();
  const s = getStrings(locale).audio;
  const {
    sections,
    index,
    isPlaying,
    position,
    duration,
    speed,
    hasFast,
    isLoaded,
    loading,
    error,
    togglePlay,
    next,
    prev,
    jumpTo,
    seekTo,
    seekBy,
    setSpeed,
  } = useAudio();

  if (loading && sections.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: palette.bg }]}>
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: palette.bg }]}>
        <Text style={{ color: palette.ink, fontFamily: FONTS.serif }}>{error}</Text>
      </View>
    );
  }
  if (sections.length === 0) return null;

  const current = sections[index] ?? sections[0];
  const effectiveDuration = duration > 0 ? duration : sectionDuration(current, speed);

  const PaceControl = hasFast ? (
    <View style={[styles.pace, { borderColor: palette.divider }]}>
      {(
        [
          ["slow", s.slower],
          ["fast", s.faster],
        ] as const
      ).map(([val, label]) => {
        const active = speed === val;
        return (
          <Pressable
            key={val}
            onPress={() => setSpeed(val)}
            style={[styles.paceBtn, active && { backgroundColor: palette.accentStrong }]}
          >
            <Text
              style={{
                fontSize: 12,
                color: active ? palette.onAccent : palette.ink,
                opacity: active ? 1 : 0.6,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  ) : null;

  if (isPlaying) {
    return (
      <View>
        <Text style={[styles.label, { color: palette.ink }]}>{s.nowPlaying.toUpperCase()}</Text>
        <Text style={[styles.currentTitle, { color: palette.ink, fontFamily: FONTS.serif }]}>
          {current.title}
        </Text>

        <View style={styles.transport}>
          <Pressable onPress={prev} disabled={index === 0} style={styles.ctrl}>
            <Ionicons
              name="play-skip-back"
              size={22}
              color={palette.ink}
              style={{ opacity: index === 0 ? 0.3 : 0.8 }}
            />
          </Pressable>
          <Pressable onPress={() => seekBy(-5)} style={styles.ctrl}>
            <Ionicons name="play-back" size={22} color={palette.ink} style={{ opacity: 0.8 }} />
          </Pressable>
          <Pressable
            onPress={togglePlay}
            style={[styles.playBtn, { backgroundColor: palette.accentStrong }]}
          >
            <Ionicons name="pause" size={32} color={palette.onAccent} />
          </Pressable>
          <Pressable onPress={() => seekBy(5)} style={styles.ctrl}>
            <Ionicons name="play-forward" size={22} color={palette.ink} style={{ opacity: 0.8 }} />
          </Pressable>
          <Pressable
            onPress={next}
            disabled={index >= sections.length - 1}
            style={styles.ctrl}
          >
            <Ionicons
              name="play-skip-forward"
              size={22}
              color={palette.ink}
              style={{ opacity: index >= sections.length - 1 ? 0.3 : 0.8 }}
            />
          </Pressable>
        </View>

        <ProgressBar
          position={position}
          duration={effectiveDuration}
          fill={palette.accent}
          track={palette.divider}
          onSeek={seekTo}
        />
        <View style={styles.times}>
          <Text style={[styles.time, { color: palette.ink }]}>{formatTime(position)}</Text>
          <Text style={[styles.time, { color: palette.ink }]}>
            {formatTime(effectiveDuration)}
          </Text>
        </View>

        {PaceControl ? <View style={styles.paceRow}>{PaceControl}</View> : null}
        {!isLoaded ? (
          <ActivityIndicator color={palette.accent} style={{ marginTop: 8 }} />
        ) : null}
        <DownloadControl locale={locale} />
      </View>
    );
  }

  // TOC mode — tap a section to play it.
  const total = sections.reduce((n, s) => n + sectionDuration(s, speed), 0);
  return (
    <View>
      <Text style={[styles.label, { color: palette.ink }]}>{s.listen.toUpperCase()}</Text>
      <ScrollView style={styles.toc}>
        {sections.map((s, i) => {
          const active = i === index;
          // A sutta's title track (id "title", or "<slug>--title" in the
          // combined /read playlist) is bold so it reads as a section header;
          // the chapter rows under it stay regular weight.
          const isTitle = s.id === "title" || s.id.endsWith("--title");
          return (
            <Pressable
              key={s.id}
              onPress={() => jumpTo(i)}
              style={[styles.row, { borderColor: palette.divider }]}
            >
              <Ionicons
                name="play"
                size={13}
                color={active ? palette.accent : palette.ink}
                style={{ opacity: active ? 1 : 0.3, width: 16 }}
              />
              <Text
                style={[
                  styles.rowTitle,
                  isTitle && styles.rowTitleStrong,
                  { color: palette.ink, opacity: active ? 1 : 0.85 },
                ]}
                numberOfLines={1}
              >
                {s.title}
              </Text>
              <Text style={{ color: palette.ink, opacity: 0.4, fontSize: 12 }}>
                {formatTime(sectionDuration(s, speed))}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={[styles.tocFooter, { borderColor: palette.divider }]}>
        {PaceControl}
        <Text style={{ marginLeft: "auto", color: palette.ink, opacity: 0.35, fontSize: 12 }}>
          {s.sectionsTotalLine
            .replace("{n}", String(sections.length))
            .replace("{time}", formatTime(total))}
        </Text>
      </View>
      <DownloadControl locale={locale} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { padding: 24, alignItems: "center", justifyContent: "center", minHeight: 80 },
  label: {
    fontSize: 11,
    letterSpacing: 1.5,
    opacity: 0.5,
    marginBottom: 8,
    fontWeight: "600",
  },
  currentTitle: { fontSize: 17, textAlign: "center", marginBottom: 16 },
  transport: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  ctrl: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  playBtn: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  scrubHit: { height: 24, justifyContent: "center" },
  scrubTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  times: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  time: { fontSize: 12, opacity: 0.6, fontVariant: ["tabular-nums"] },
  paceRow: { alignItems: "center", marginTop: 16 },
  pace: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 999,
    padding: 2,
    gap: 2,
  },
  paceBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  toc: { maxHeight: 280 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  // Chapter rows are regular weight; only a sutta's title track is bolded (see
  // rowTitleStrong) so it reads as a section header in the combined playlist.
  rowTitle: { flex: 1, fontWeight: "400" },
  rowTitleStrong: { fontWeight: "600" },
  tocFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    marginTop: 2,
    borderTopWidth: 1,
  },
  dlBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 16,
    alignSelf: "center",
  },
  dlText: { fontSize: 13 },
});
