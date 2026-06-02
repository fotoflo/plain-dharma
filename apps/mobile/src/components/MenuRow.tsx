/**
 * Drill-down menu primitives for the More tab (iOS-Settings pattern).
 *
 *   <SectionLabel>Support the project</SectionLabel>
 *   <MenuGroup>
 *     <MenuRow icon="heart-outline" label="Donate" href="/donate" />
 *     <MenuRow icon="mail-outline" label="Newsletter" href="/newsletter" />
 *   </MenuGroup>
 *
 * MenuGroup is a bordered, rounded card that hides the divider under its last
 * row. MenuRow is a single tappable line: leading icon, label, optional right
 * value, and a chevron. Pass `href` (pushes a route) or `onPress`.
 */

import { Ionicons } from "@expo/vector-icons";
import { Link, type Href } from "expo-router";
import { Children, cloneElement, isValidElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

export function SectionLabel({ children }: { children: string }) {
  const { palette } = useTheme();
  return (
    <Text style={[styles.sectionLabel, { color: palette.ink }]}>
      {children.toUpperCase()}
    </Text>
  );
}

export function MenuGroup({ children }: { children: React.ReactNode }) {
  const { palette } = useTheme();
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <View style={[styles.group, { borderColor: palette.divider }]}>
      {items.map((child, i) =>
        // Tell the last row to drop its bottom divider.
        isValidElement<{ last?: boolean }>(child)
          ? cloneElement(child, { last: i === items.length - 1 })
          : child,
      )}
    </View>
  );
}

export function MenuRow({
  icon,
  label,
  value,
  href,
  onPress,
  last = false,
}: {
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value?: string;
  href?: Href;
  onPress?: () => void;
  /** Injected by MenuGroup for the final row — hides the divider. */
  last?: boolean;
}) {
  const { palette } = useTheme();

  const inner = (
    <View
      style={[
        styles.row,
        { borderColor: palette.divider, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth },
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={20} color={palette.accent} style={styles.icon} />
      ) : null}
      <Text style={[styles.label, { color: palette.ink, fontFamily: FONTS.serif }]}>
        {label}
      </Text>
      {value ? (
        <Text style={[styles.value, { color: palette.ink, fontFamily: FONTS.serif }]}>
          {value}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={palette.ink} style={styles.chevron} />
    </View>
  );

  if (href != null) {
    return (
      <Link href={href} asChild>
        <Pressable accessibilityRole="button" accessibilityLabel={label}>
          {inner}
        </Pressable>
      </Link>
    );
  }
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1.2,
    opacity: 0.5,
    marginTop: 28,
    marginBottom: 8,
    marginLeft: 4,
  },
  group: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 16,
    gap: 12,
  },
  icon: { width: 24, textAlign: "center" },
  label: { fontSize: 17, flex: 1 },
  value: { fontSize: 16, opacity: 0.5 },
  chevron: { opacity: 0.3 },
});
