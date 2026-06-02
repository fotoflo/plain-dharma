import { StyleSheet, Text } from "react-native";

import { SubScreen } from "@/components/SubScreen";
import { useMarginalia } from "@/marginalia/AuthContext";
import { SignInCard } from "@/marginalia/SignInCard";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

// Account screen — SignInCard's two states (signed-in: email + sign out;
// signed-out: pitch + magic-link field) given a full screen. Reached from the
// Account card on the More tab; that card is hidden when sync isn't configured,
// so the fallback below is just a safety net.
export default function AccountScreen() {
  const { palette } = useTheme();
  const { syncAvailable, signedIn } = useMarginalia();

  return (
    <SubScreen kicker="Account" title="Account">
      <Text style={[styles.note, { color: palette.ink, fontFamily: FONTS.serif }]}>
        {syncAvailable
          ? signedIn
            ? "Your highlights and notes sync across every device you sign in on."
            : "Sign in to sync your highlights and notes across devices. We'll email you a magic link — no password."
          : "Account sync isn't available in this build."}
      </Text>

      <SignInCard />
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 17, lineHeight: 27, marginBottom: 16 },
});
