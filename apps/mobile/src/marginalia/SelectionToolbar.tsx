/**
 * Floating selection toolbar — the mobile counterpart of the web Marginalia
 * toolbar (src/components/marginalia/Marginalia.tsx).
 *
 * Web order is: Highlight · Note · Copy · Share, anchored above the selection
 * and flipping below when it would collide with the fixed nav. Mobile mirrors
 * the feel: a rounded pill that floats just above the dragged selection (and
 * flips below near the top of the screen). The web's single amber "Highlight"
 * button is expanded into the project's color swatches (tapping one creates the
 * highlight in that color immediately — the web only has amber); then Note and
 * Share, matching the web's ordering. Copy is folded into the share sheet's
 * "Copy passage" affordance, same as the existing mobile ShareSheet.
 */

import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";
import {
  HIGHLIGHT_COLOR_KEYS,
  HIGHLIGHT_COLORS,
  type HighlightColorKey,
} from "./colors";
import { MARGINALIA_STRINGS as t } from "./strings";

/** Absolute position (within the scroll content) + flip direction. */
export interface ToolbarAnchor {
  /** Left edge of the pill (already clamped to the viewport by the reader). */
  left: number;
  /** Top edge of the pill. */
  top: number;
}

export function SelectionToolbar({
  anchor,
  activeColor,
  onColor,
  onNote,
  onShare,
}: {
  anchor: ToolbarAnchor;
  activeColor: HighlightColorKey;
  /** Tap a swatch → create the highlight in that color immediately. */
  onColor: (color: HighlightColorKey) => void;
  onNote: () => void;
  onShare: () => void;
}) {
  const { theme, palette } = useTheme();

  return (
    <View
      style={[
        styles.pill,
        {
          left: anchor.left,
          top: anchor.top,
          backgroundColor: palette.bg,
          borderColor: palette.divider,
        },
      ]}
    >
      {HIGHLIGHT_COLOR_KEYS.map((key) => {
        const selected = key === activeColor;
        return (
          <Pressable
            key={key}
            accessibilityLabel={`${t.highlight} ${key}`}
            hitSlop={6}
            onPress={() => onColor(key)}
            style={[
              styles.swatch,
              {
                backgroundColor: HIGHLIGHT_COLORS[key][theme].swatch,
                borderColor: selected ? palette.ink : "transparent",
                borderWidth: selected ? 2 : 0,
              },
            ]}
          />
        );
      })}

      <View style={[styles.sep, { backgroundColor: palette.divider }]} />

      <Pressable
        accessibilityLabel={t.note}
        hitSlop={6}
        onPress={onNote}
        style={styles.action}
      >
        <Ionicons name="create-outline" size={16} color={palette.ink} />
        <Text style={[styles.label, { color: palette.ink, fontFamily: FONTS.serif }]}>
          {t.note}
        </Text>
      </Pressable>

      <Pressable
        accessibilityLabel={t.share}
        hitSlop={6}
        onPress={onShare}
        style={styles.action}
      >
        <Ionicons name="share-outline" size={16} color={palette.ink} />
        <Text style={[styles.label, { color: palette.ink, fontFamily: FONTS.serif }]}>
          {t.share}
        </Text>
      </Pressable>
    </View>
  );
}

/** Width estimate used by the reader to clamp the pill within the viewport. */
export const TOOLBAR_WIDTH = 248;
/** Height used to flip the pill below the selection near the top of the screen. */
export const TOOLBAR_HEIGHT = 40;

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    height: TOOLBAR_HEIGHT,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    zIndex: 40,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  swatch: { width: 20, height: 20, borderRadius: 10 },
  sep: { width: 1, height: 20, marginHorizontal: 3, opacity: 0.8 },
  action: { flexDirection: "row", alignItems: "center", gap: 3 },
  label: { fontSize: 14 },
});
