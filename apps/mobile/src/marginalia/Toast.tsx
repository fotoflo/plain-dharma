/**
 * Tiny transient toast — the mobile counterpart of the web Marginalia toast
 * ("Highlighted", "Note saved", "Removed", "Link copied"). Fades in/out and
 * auto-dismisses; controlled by a message string (null = hidden).
 */

import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";

import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

export function Toast({ message }: { message: string | null }) {
  const { palette } = useTheme();
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: message ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [message, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        { backgroundColor: palette.bg, borderColor: palette.divider, opacity },
      ]}
    >
      <Text style={[styles.text, { color: palette.ink, fontFamily: FONTS.serif }]}>
        {message ?? ""}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
    zIndex: 60,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  text: { fontSize: 14, opacity: 0.85 },
});
