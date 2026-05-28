import { useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";

import { useReadingPrefs } from "@/theme/ReadingPrefsContext";
import { useTheme } from "@/theme/ThemeContext";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// Light-mode saffron "wash": soft low-opacity discs drifting off the top-right
// and bottom-left edges. Approximates the web's radial Wash without a blur/SVG
// dependency (a couple of large translucent circles read as a gentle glow).
function Wash({ accent }: { accent: string }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.disc,
          { backgroundColor: accent, opacity: 0.06, width: 380, height: 380, top: -130, right: -120 },
        ]}
      />
      <View
        style={[
          styles.disc,
          { backgroundColor: accent, opacity: 0.05, width: 300, height: 300, bottom: -110, left: -110 },
        ]}
      />
    </View>
  );
}

// Dark-mode "night sky": a static field of faint white stars. (The web twinkles
// via canvas; a static field is the dependency-free approximation for v1.)
function NightSky() {
  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        key: i,
        left: Math.random() * SCREEN_W,
        top: Math.random() * SCREEN_H,
        size: Math.random() < 0.85 ? 1.5 : 2.5,
        opacity: 0.2 + Math.random() * 0.55,
      })),
    []
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {stars.map((s) => (
        <View
          key={s.key}
          style={{
            position: "absolute",
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            borderRadius: s.size / 2,
            backgroundColor: "#ffffff",
            opacity: s.opacity,
          }}
        />
      ))}
    </View>
  );
}

// Decorative layer behind screen content. Suppressed at the high/low contrast
// extremes (flat white/black), mirroring the web (which drops the star field
// for dark low/high). Render as the first child of a screen's root View, with
// the scroll content transparent above it.
export function DecorativeBackground() {
  const { theme, palette } = useTheme();
  const { contrast } = useReadingPrefs();
  if (theme === "light" && contrast !== "high") return <Wash accent={palette.accent} />;
  if (theme === "dark" && contrast === "med") return <NightSky />;
  return null;
}

const styles = StyleSheet.create({
  disc: { position: "absolute", borderRadius: 9999 },
});
