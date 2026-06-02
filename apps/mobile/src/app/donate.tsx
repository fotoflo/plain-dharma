import { Pressable, StyleSheet, Text } from "react-native";

import { SubScreen } from "@/components/SubScreen";
import { openDonate } from "@/lib/links";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

// Donate screen — the CC0/free framing, then a single "Donate →" that opens the
// web Stripe Checkout in a secure in-app browser (content is free, so this stays
// App-Store-compliant; no in-app purchase).
export default function DonateScreen() {
  const { palette } = useTheme();

  return (
    <SubScreen kicker="Support" title="Support the project">
      <Text style={[styles.p, { color: palette.ink, fontFamily: FONTS.serif }]}>
        {"Plain Dharma is free — free to read, free to copy, free to print, free to listen — and dedicated to the public domain. There is nothing to buy."}
      </Text>
      <Text style={[styles.p, { color: palette.ink, fontFamily: FONTS.serif }]}>
        {"If it's been of use to you and you'd like to help keep it freely available — covering hosting, translation, and narration — a gift of any size is gratefully received. Give nothing and read everything; the offer is the same."}
      </Text>

      <Pressable
        onPress={() => openDonate()}
        style={[styles.donate, { backgroundColor: palette.accentStrong }]}
        accessibilityRole="button"
      >
        <Text style={{ color: palette.onAccent, fontFamily: FONTS.serif, fontSize: 17 }}>
          Donate →
        </Text>
      </Pressable>
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  p: { fontSize: 17, lineHeight: 27, marginTop: 14 },
  donate: {
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 28,
  },
});
