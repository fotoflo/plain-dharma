import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { AudioProvider } from "@/audio/AudioProvider";
import { DownloadsProvider } from "@/audio/DownloadsProvider";
import { ReadingPrefsProvider } from "@/theme/ReadingPrefsContext";
import { ThemeProvider, useTheme } from "@/theme/ThemeContext";

SplashScreen.preventAutoHideAsync();

function Navigator() {
  const { theme, palette } = useTheme();
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
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider>
      <ReadingPrefsProvider>
        <DownloadsProvider>
          <AudioProvider>
            <Navigator />
          </AudioProvider>
        </DownloadsProvider>
      </ReadingPrefsProvider>
    </ThemeProvider>
  );
}
