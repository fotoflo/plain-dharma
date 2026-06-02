import { getStrings } from "@plain-dharma/content/strings";
import { StyleSheet, Text } from "react-native";

import { NewsletterSignup } from "@/components/NewsletterSignup";
import { SubScreen } from "@/components/SubScreen";
import { useLocale } from "@/i18n/LocaleContext";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

// Newsletter screen — the shared lead + the signup form (Resend-backed; the
// owner gets a notification, the subscriber a welcome).
export default function NewsletterScreen() {
  const { palette } = useTheme();
  const { locale } = useLocale();
  const n = getStrings(locale).newsletter;

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
