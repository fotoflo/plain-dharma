import { Tabs } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReadingPrefs } from "@/theme/ReadingPrefsContext";
import { useTheme } from "@/theme/ThemeContext";
import { CONTRAST_BG, FONTS } from "@/theme/tokens";

// A custom bottom tab bar so we can do two things the default bar can't:
//   1. Tint the bar to match the Read screen's *contrast* background (the
//      reading-controls "contrast" override changes the page bg, and the bar
//      should follow it — but only on Read, so Home/More stay on the theme bg).
//   2. Slide the bar away on scroll-down and back on scroll-up.
// It's absolutely positioned, so scenes pad their bottom by `useTabBarInset()`.

type TabBarCtx = {
  translateY: Animated.Value;
  height: number;
  setHeight: (h: number) => void;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Re-show the bar and re-baseline scroll tracking (call on tab focus). */
  prime: () => void;
};

const Ctx = createContext<TabBarCtx | null>(null);

export function TabBarVisibilityProvider({ children }: { children: ReactNode }) {
  // Lazy useState (not useRef.current) so the value is stable without reading a
  // ref during render.
  const [translateY] = useState(() => new Animated.Value(0));
  const [height, setHeightState] = useState(0);
  const heightRef = useRef(0);
  const lastY = useRef(0);
  const hidden = useRef(false);
  const primed = useRef(false);

  const animate = useCallback(
    (toHidden: boolean) => {
      if (hidden.current === toHidden) return;
      hidden.current = toHidden;
      Animated.timing(translateY, {
        toValue: toHidden ? heightRef.current : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
    [translateY],
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      // First event after a tab switch just sets the baseline (the new scene may
      // already be scrolled), so we never spuriously hide on focus.
      if (!primed.current) {
        primed.current = true;
        lastY.current = y;
        return;
      }
      const dy = y - lastY.current;
      lastY.current = y;
      if (y <= 4) animate(false);
      else if (dy > 8) animate(true);
      else if (dy < -8) animate(false);
    },
    [animate],
  );

  const setHeight = useCallback(
    (h: number) => {
      if (h > 0 && Math.abs(h - heightRef.current) > 0.5) {
        heightRef.current = h;
        setHeightState(h);
        if (hidden.current) translateY.setValue(h);
      }
    },
    [translateY],
  );

  const prime = useCallback(() => {
    primed.current = false;
    animate(false);
  }, [animate]);

  const value = useMemo<TabBarCtx>(
    () => ({ translateY, height, setHeight, onScroll, prime }),
    [translateY, height, setHeight, onScroll, prime],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function useTabBar(): TabBarCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTabBar must be used within TabBarVisibilityProvider");
  return ctx;
}

/** Scroll handler that drives the hide-on-scroll behaviour. */
export function useTabBarScroll(): (e: NativeSyntheticEvent<NativeScrollEvent>) => void {
  return useTabBar().onScroll;
}

/** Bottom padding a scroll view needs so its content clears the floating bar. */
export function useTabBarInset(): number {
  const { height } = useTabBar();
  const insets = useSafeAreaInsets();
  return height > 0 ? height : insets.bottom + 56;
}

/**
 * How much the tab bar overlaps content *above* the safe-area inset — i.e. the
 * extra a bottom-anchored floating control must clear to sit above the bar.
 * Returns 0 when there's no tab bar in the tree (safe outside the provider), so
 * floating controls can use it unconditionally.
 */
export function useTabBarOverlap(): number {
  const ctx = useContext(Ctx);
  const insets = useSafeAreaInsets();
  if (!ctx || ctx.height <= 0) return 0;
  return Math.max(0, ctx.height - insets.bottom);
}

// Derive the exact props expo-router hands the `tabBar` render prop straight
// from the public `Tabs` type, so we stay in sync with React Navigation's
// generics without importing its internal build path.
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

export function AnimatedTabBar({ state, descriptors, navigation }: TabBarProps) {
  const { theme, palette } = useTheme();
  const { contrast } = useReadingPrefs();
  const insets = useSafeAreaInsets();
  const { translateY, setHeight, prime } = useTabBar();

  const focusedName = state.routes[state.index]?.name;
  // Match the Read screen's contrast-adjusted background; everywhere else the
  // bar sits on the plain theme background.
  const bg =
    focusedName === "read" ? (CONTRAST_BG[theme][contrast] ?? palette.bg) : palette.bg;

  // Re-show + re-baseline whenever the active tab changes.
  useEffect(() => {
    prime();
  }, [focusedName, prime]);

  return (
    <Animated.View
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      style={[styles.wrap, { transform: [{ translateY }] }]}
    >
      <View
        style={[
          styles.row,
          {
            backgroundColor: bg,
            borderTopColor: palette.divider,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? palette.accent : `${palette.ink}99`;
          const label = options.title ?? route.name;
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() =>
                navigation.emit({ type: "tabLongPress", target: route.key })
              }
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              style={styles.item}
            >
              {options.tabBarIcon?.({ focused, color, size: 24 })}
              <Text style={[styles.label, { color }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0 },
  row: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2, paddingBottom: 4 },
  label: { fontSize: 11, fontFamily: FONTS.serif },
});
