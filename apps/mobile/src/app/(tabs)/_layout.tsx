import { Ionicons } from "@expo/vector-icons";
import { getStrings } from "@plain-dharma/content/strings";
import { Tabs } from "expo-router";

import { useLocale } from "@/i18n/LocaleContext";
import {
  AnimatedTabBar,
  TabBarVisibilityProvider,
} from "@/navigation/TabBar";
import { useTheme } from "@/theme/ThemeContext";

export default function TabsLayout() {
  const { palette } = useTheme();
  const { locale } = useLocale();
  const nav = getStrings(locale).nav;
  return (
    <TabBarVisibilityProvider>
      <Tabs
        tabBar={(props) => <AnimatedTabBar {...props} />}
        screenOptions={{
          headerShown: false,
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
    </TabBarVisibilityProvider>
  );
}
