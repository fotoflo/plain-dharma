import { Ionicons } from "@expo/vector-icons";
import type { Locale, SuttaSlug } from "@plain-dharma/content";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAudio } from "@/audio/AudioProvider";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";
import { AudioPanel } from "./AudioPanel";

// Floating "Listen" pill + popover panel, mirroring the web FloatingAudioPlayer.
// Audio is fetched lazily on first open (keeps the screen cheap if you don't
// listen). i18n labels are hardcoded EN for now — wire to shared strings when
// the locale switcher (chrome) lands.
export function FloatingAudioPlayer({
  locale,
  slug,
}: {
  locale: Locale;
  slug: SuttaSlug;
}) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { load } = useAudio();
  const [open, setOpen] = useState(false);

  const toggle = () => {
    setOpen((v) => {
      const nextOpen = !v;
      if (nextOpen) void load(locale, slug);
      return nextOpen;
    });
  };

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
          <AudioPanel />
        </View>
      ) : null}
      <Pressable
        onPress={toggle}
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
