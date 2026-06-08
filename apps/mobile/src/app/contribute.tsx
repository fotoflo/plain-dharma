import { Pressable, StyleSheet, Text, View } from "react-native";

import { SubScreen } from "@/components/SubScreen";
import { useStrings } from "@/i18n/strings";
import { openContribute } from "@/lib/links";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

// Contribute screen — the copy-editors / translators / voice-artists pitch
// (shared strings) + "Get in touch →", which opens the web contribute form in a
// secure in-app browser (the form lives server-side via Resend).
export default function ContributeScreen() {
  const { palette } = useTheme();
  const c = useStrings().contribute;

  return (
    <SubScreen kicker={c.kicker} title={c.h1}>
      <Text style={[styles.intro, { color: palette.ink, fontFamily: FONTS.serif }]}>
        {c.pHelpIntro}
      </Text>

      <View style={styles.bullets}>
        <Text style={[styles.bullet, { color: palette.ink, fontFamily: FONTS.serif }]}>
          <Text style={{ fontFamily: FONTS.serifBold }}>{c.liCopyEditorsLabel}</Text>
          {c.liCopyEditorsBody}
        </Text>
        <Text style={[styles.bullet, { color: palette.ink, fontFamily: FONTS.serif }]}>
          <Text style={{ fontFamily: FONTS.serifBold }}>{c.liTranslatorsLabel}</Text>
          {c.liTranslatorsBody}
        </Text>
        <Text style={[styles.bullet, { color: palette.ink, fontFamily: FONTS.serif }]}>
          <Text style={{ fontFamily: FONTS.serifBold }}>{c.liVoiceArtistsLabel}</Text>
          {c.liVoiceArtistsBody}
        </Text>
      </View>

      <Text style={[styles.closing, { color: palette.ink, fontFamily: FONTS.serif }]}>
        {c.pHelpClosing}
      </Text>

      <Pressable
        onPress={() => openContribute()}
        style={[styles.outlineBtn, { borderColor: palette.accent }]}
        accessibilityRole="button"
      >
        <Text style={{ color: palette.accent, fontFamily: FONTS.serif, fontSize: 17 }}>
          Get in touch →
        </Text>
      </Pressable>
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 17, lineHeight: 27, marginTop: 14 },
  bullets: { gap: 12, marginTop: 18 },
  bullet: { fontSize: 16, lineHeight: 25 },
  closing: { fontSize: 17, lineHeight: 27, marginTop: 18 },
  outlineBtn: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 28,
  },
});
