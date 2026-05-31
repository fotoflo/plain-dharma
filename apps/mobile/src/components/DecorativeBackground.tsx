import { Dimensions, StyleSheet, View } from "react-native";

import { useReadingPrefs } from "@/theme/ReadingPrefsContext";
import { useTheme } from "@/theme/ThemeContext";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// Static star field, generated once at module load (Math.random must not run
// during render — react-hooks/purity). A fixed field is fine: the web twinkles
// via canvas, but here the sky is decorative and stationary.
const STARS = Array.from({ length: 70 }, (_, i) => ({
  key: i,
  left: Math.random() * SCREEN_W,
  top: Math.random() * SCREEN_H,
  size: Math.random() < 0.85 ? 1.2 : 2,
  // Kept very faint so the field reads as a hint behind the text, not a
  // competing texture (the med-contrast reading surface sits on top).
  opacity: 0.07 + Math.random() * 0.16,
}));

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

// Dark-mode "night sky": a static field of faint white stars.
function NightSky() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {STARS.map((s) => (
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
