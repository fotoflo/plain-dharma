import { Ionicons } from "@expo/vector-icons";
import { getStrings } from "@plain-dharma/content/strings";
import { Tabs } from "expo-router";

import { useLocale } from "@/i18n/LocaleContext";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

export default function TabsLayout() {
  const { palette } = useTheme();
  const { locale } = useLocale();
  const nav = getStrings(locale).nav;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: `${palette.ink}99`,
        tabBarStyle: {
          backgroundColor: palette.bg,
          borderTopColor: palette.divider,
        },
        tabBarLabelStyle: { fontFamily: FONTS.serif },
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: nav.home,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="read"
        options={{
          title: nav.read,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: nav.more,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
