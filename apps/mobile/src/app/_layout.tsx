import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_400Regular_Italic,
  AtkinsonHyperlegible_700Bold,
} from "@expo-google-fonts/atkinson-hyperlegible";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AudioProvider } from "@/audio/AudioProvider";
import { DownloadsProvider } from "@/audio/DownloadsProvider";
import { useScreenTracking } from "@/lib/useScreenTracking";
import { AuthProvider } from "@/marginalia/AuthContext";
import { ReadingPrefsProvider } from "@/theme/ReadingPrefsContext";
import { ThemeProvider, useTheme } from "@/theme/ThemeContext";

SplashScreen.preventAutoHideAsync();

function Navigator() {
  const { theme, palette } = useTheme();
  // Fire GA4 screen_view on every expo-router navigation (prod only).
  useScreenTracking();
  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.bg },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    GaramondLibre: require("../../assets/fonts/GaramondLibre-Regular.otf"),
    "GaramondLibre-Bold": require("../../assets/fonts/GaramondLibre-Bold.otf"),
    "GaramondLibre-Italic": require("../../assets/fonts/GaramondLibre-Italic.otf"),
    "GaramondLibre-BoldItalic": require("../../assets/fonts/GaramondLibre-BoldItalic.otf"),
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
    AtkinsonHyperlegible_400Regular_Italic,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ReadingPrefsProvider>
          <AuthProvider>
            <DownloadsProvider>
              <AudioProvider>
                <Navigator />
              </AudioProvider>
            </DownloadsProvider>
          </AuthProvider>
        </ReadingPrefsProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
