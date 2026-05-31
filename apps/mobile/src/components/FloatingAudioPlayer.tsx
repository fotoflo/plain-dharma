import { Ionicons } from "@expo/vector-icons";
import type { Locale, SuttaSlug } from "@plain-dharma/content";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAudio } from "@/audio/AudioProvider";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";
import { AudioPanel } from "./AudioPanel";

// Floating "Listen" pill + popover panel, mirroring the web FloatingAudioPlayer.
// Audio is loaded lazily on first open (keeps the screen cheap if you don't
// listen); the manifest is OTA-bundled so opening is instant. i18n labels are
// hardcoded EN for now — wire to shared strings when the locale switcher
// (chrome) lands. Controlled: the parent (FloatingControls) owns `open` so only
// one floating panel can be open at a time.
export function FloatingAudioPlayer({
  locale,
  slug,
  combined = false,
  open,
  onToggle,
}: {
  locale: Locale;
  slug?: SuttaSlug;
  combined?: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { load, loadCombined } = useAudio();

  // Kick off the (cheap, manifest-only) load the first time the panel opens.
  useEffect(() => {
    if (!open) return;
    if (combined) void loadCombined(locale);
    else if (slug) void load(locale, slug);
  }, [open, combined, locale, slug, load, loadCombined]);

  return (
    <View
      style={[styles.wrap, { bottom: insets.bottom + 16 }]}
      pointerEvents="box-none"
    >
      {open ? (
        <View
          style={[
            styles.panel,
            { backgroundColor: palette.bg, borderColor: palette.accent },
          ]}
        >
          <AudioPanel locale={locale} />
        </View>
      ) : null}
      <Pressable
        onPress={onToggle}
        style={[styles.fab, { backgroundColor: palette.bg, borderColor: palette.accent }]}
        accessibilityRole="button"
        accessibilityLabel={open ? "Close audio player" : "Listen"}
      >
        <Ionicons name={open ? "chevron-down" : "play"} size={15} color={palette.accent} />
        <Text style={{ color: palette.accent, fontFamily: FONTS.serif, fontSize: 15 }}>
          {open ? "Close" : "Listen"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 16,
    alignItems: "flex-end",
    gap: 10,
    zIndex: 10,
  },
  panel: {
    width: 320,
    maxWidth: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
