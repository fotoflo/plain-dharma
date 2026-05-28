import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReadingPrefs } from "@/theme/ReadingPrefsContext";
import { useTheme, type ThemeMode } from "@/theme/ThemeContext";
import type { Palette } from "@/theme/tokens";
import { FONTS, type Contrast, type ReadingFont, type ReadingSize } from "@/theme/tokens";

type Option<T> = { value: T; label: string; glyph?: number };

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  palette,
  serifGlyph,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  palette: Palette;
  serifGlyph?: boolean;
}) {
  return (
    <View style={styles.group}>
      <Text style={[styles.groupLabel, { color: palette.ink }]}>{label}</Text>
      <View style={[styles.segRow, { borderColor: palette.divider }]}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[styles.seg, active && { backgroundColor: palette.accentStrong }]}
            >
              <Text
                style={{
                  color: active ? palette.onAccent : palette.ink,
                  opacity: active ? 1 : 0.7,
                  fontFamily: serifGlyph ? FONTS.serif : undefined,
                  fontSize: opt.glyph ?? 14,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const SIZE_OPTS: Option<ReadingSize>[] = [
  { value: "sm", label: "A", glyph: 13 },
  { value: "md", label: "A", glyph: 16 },
  { value: "lg", label: "A", glyph: 19 },
  { value: "xl", label: "A", glyph: 23 },
];
const CONTRAST_OPTS: Option<Contrast>[] = [
  { value: "low", label: "Low" },
  { value: "med", label: "Med" },
  { value: "high", label: "High" },
];
const FONT_OPTS: Option<ReadingFont>[] = [
  { value: "serif", label: "Serif" },
  { value: "accessible", label: "Accessible" },
];
const THEME_OPTS: Option<ThemeMode>[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Auto" },
];

// Floating "Aa" reading controls, mirroring the web ReadingControls panel:
// size / contrast / font, plus a theme toggle. Wired to ReadingPrefsContext +
// ThemeContext. Contrast/font behavior matches the committed globals.css.
export function FloatingReadingControls() {
  const insets = useSafeAreaInsets();
  const { palette, mode, setMode } = useTheme();
  const { size, contrast, font, setSize, setContrast, setFont } = useReadingPrefs();
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.wrap, { top: insets.top + 8 }]} pointerEvents="box-none">
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={[styles.fab, { backgroundColor: palette.bg, borderColor: palette.accent }]}
        accessibilityRole="button"
        accessibilityLabel="Reading settings"
      >
        <Text style={{ color: palette.accent, fontFamily: FONTS.serif, fontSize: 18 }}>
          Aa
        </Text>
      </Pressable>
      {open ? (
        <View
          style={[styles.panel, { backgroundColor: palette.bg, borderColor: palette.divider }]}
        >
          <Segmented
            label="SIZE"
            value={size}
            options={SIZE_OPTS}
            onChange={setSize}
            palette={palette}
            serifGlyph
          />
          <Segmented
            label="CONTRAST"
            value={contrast}
            options={CONTRAST_OPTS}
            onChange={setContrast}
            palette={palette}
          />
          <Segmented
            label="FONT"
            value={font}
            options={FONT_OPTS}
            onChange={setFont}
            palette={palette}
          />
          <Segmented
            label="THEME"
            value={mode}
            options={THEME_OPTS}
            onChange={setMode}
            palette={palette}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", right: 16, alignItems: "flex-end", gap: 8, zIndex: 10 },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  panel: {
    width: 280,
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
  group: { marginBottom: 14 },
  groupLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    opacity: 0.5,
    marginBottom: 6,
    fontWeight: "600",
  },
  segRow: { flexDirection: "row", borderWidth: 1, borderRadius: 999, padding: 2, gap: 2 },
  seg: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 999,
  },
});
