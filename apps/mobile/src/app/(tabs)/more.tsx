import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DebugInfo } from "@/components/DebugInfo";
import { MenuGroup, MenuRow, SectionLabel } from "@/components/MenuRow";
import { useMarginalia } from "@/marginalia/AuthContext";
import { useTheme, type ThemeMode } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

const THEME_OPTS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Auto" },
];

// "More" tab — a calm iOS-Settings drill-down menu. Each row pushes to a focused
// sub-screen (Account / Donate / Contribute / Newsletter / About / Glossary);
// Appearance stays inline because it's a single toggle. The reader's own content
// (notes, offline audio) lives with reading/listening, not here — see
// docs/architecture/more-tab-refactor.md.
export default function MoreScreen() {
  const { palette, mode, setMode } = useTheme();
  const { syncAvailable, signedIn, email } = useMarginalia();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 20,
      }}
    >
      <Text style={[styles.title, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
        Plain Dharma
      </Text>

      {/* Account card — live status; hidden entirely when sync isn't configured. */}
      {syncAvailable ? (
        <Link href="/account" asChild>
          <Pressable
            style={[styles.account, { borderColor: palette.divider }]}
            accessibilityRole="button"
            accessibilityLabel="Account"
          >
            <Ionicons
              name={signedIn ? "checkmark-circle" : "person-circle-outline"}
              size={36}
              color={palette.accent}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.accountTitle, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
                {signedIn ? "Signed in" : "Sign in to sync"}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.accountSub, { color: palette.ink, fontFamily: FONTS.serif }]}
              >
                {signedIn
                  ? (email ?? "Synced across your devices")
                  : "Highlights & notes across your devices"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.ink} style={{ opacity: 0.3 }} />
          </Pressable>
        </Link>
      ) : null}

      {/* Settings — Appearance kept inline (single toggle, no screen needed). */}
      <SectionLabel>Settings</SectionLabel>
      <View style={[styles.card, { borderColor: palette.divider }]}>
        <Text style={[styles.cardLabel, { color: palette.ink, fontFamily: FONTS.serif }]}>
          Appearance
        </Text>
        <View style={[styles.segRow, { borderColor: palette.divider }]}>
          {THEME_OPTS.map((opt) => {
            const active = opt.value === mode;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setMode(opt.value)}
                style={[styles.seg, active && { backgroundColor: palette.accentStrong }]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={{
                    color: active ? palette.onAccent : palette.ink,
                    opacity: active ? 1 : 0.7,
                    fontFamily: FONTS.serif,
                    fontSize: 15,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <SectionLabel>Support the project</SectionLabel>
      <MenuGroup>
        <MenuRow icon="heart-outline" label="Donate" href="/donate" />
        <MenuRow icon="create-outline" label="Contribute" href="/contribute" />
        <MenuRow icon="mail-outline" label="Newsletter" href="/newsletter" />
      </MenuGroup>

      <SectionLabel>About</SectionLabel>
      <MenuGroup>
        <MenuRow icon="information-circle-outline" label="About Plain Dharma" href="/about" />
        <MenuRow icon="list-outline" label="Glossary" href="/glossary" />
        <MenuRow icon="download-outline" label="Download the book" href="/download" />
      </MenuGroup>

      <DebugInfo />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 34, marginBottom: 20 },
  account: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  accountTitle: { fontSize: 18 },
  accountSub: { fontSize: 14, opacity: 0.6, marginTop: 1 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  cardLabel: { fontSize: 17 },
  segRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 999,
    padding: 2,
    gap: 2,
  },
  seg: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 999,
  },
});
