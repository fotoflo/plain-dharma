import { StyleSheet, Text } from "react-native";

import { NewsletterSignup } from "@/components/NewsletterSignup";
import { SubScreen } from "@/components/SubScreen";
import { useStrings } from "@/i18n/strings";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

// Newsletter screen — the shared lead + the signup form (Resend-backed; the
// owner gets a notification, the subscriber a welcome).
export default function NewsletterScreen() {
  const { palette } = useTheme();
  const n = useStrings().newsletter;

  return (
    <SubScreen kicker="Newsletter" title={n.heading}>
      <Text style={[styles.lead, { color: palette.ink, fontFamily: FONTS.serif }]}>
        {n.lead}
      </Text>

      <NewsletterSignup />
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: 17, lineHeight: 27, marginTop: 14, marginBottom: 20 },
});
