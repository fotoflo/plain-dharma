import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useStrings } from "@/i18n/strings";
import {
  AnimatedTabBar,
  TabBarVisibilityProvider,
} from "@/navigation/TabBar";
import { useTheme } from "@/theme/ThemeContext";

export default function TabsLayout() {
  const { palette } = useTheme();
  const nav = useStrings().nav;
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
