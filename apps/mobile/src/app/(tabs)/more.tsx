import { Ionicons } from "@expo/vector-icons";
import { SUPPORTED_LOCALES } from "@plain-dharma/content";
import { Link } from "expo-router";
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDownloads } from "@/audio/DownloadsProvider";
import { DebugInfo } from "@/components/DebugInfo";
import { MenuGroup, MenuRow, SectionLabel } from "@/components/MenuRow";
import { LOCALE_LABELS, useLocale } from "@/i18n/LocaleContext";
import { useStrings } from "@/i18n/strings";
import type { ChineseScript } from "@/i18n/zhScript";
import { useMarginalia } from "@/marginalia/AuthContext";
import { useTabBarInset, useTabBarScroll } from "@/navigation/TabBar";
import { useTheme, type ThemeMode } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

const THEME_OPTS: { value: ThemeMode; key: "themeLight" | "themeDark" | "themeAuto" }[] = [
  { value: "light", key: "themeLight" },
  { value: "dark", key: "themeDark" },
  { value: "system", key: "themeAuto" },
];

// "More" tab — a calm iOS-Settings drill-down menu. Each row pushes to a focused
// sub-screen (Account / Donate / Contribute / Newsletter / About / Glossary);
// Appearance stays inline because it's a single toggle. The reader's own content
// (notes, offline audio) lives with reading/listening, not here — see
// docs/architecture/more-tab-refactor.md.
export default function MoreScreen() {
  const { palette, mode, setMode } = useTheme();
  const { locale, setLocale, script, setScript } = useLocale();
  const { more: s, nav } = useStrings();
  const { syncAvailable, signedIn, email, signOut, deleteAccount } = useMarginalia();
  const { downloaded, remove } = useDownloads();
  const insets = useSafeAreaInsets();
  const onScroll = useTabBarScroll();
  const tabBarInset = useTabBarInset();

  const confirmDeleteAccount = () =>
    Alert.alert(s.deleteAccount, s.deleteAccountConfirm, [
      { text: s.clearOfflineCancel, style: "cancel" },
      {
        text: s.deleteAccountCta,
        style: "destructive",
        onPress: async () => {
          const res = await deleteAccount();
          if (!res.ok) Alert.alert(s.deleteAccount, res.error ?? s.deleteAccountError);
        },
      },
    ]);

  const confirmClearOffline = () =>
    Alert.alert(s.clearOffline, s.clearOfflineConfirm, [
      { text: s.clearOfflineCancel, style: "cancel" },
      {
        text: s.clearOfflineConfirmCta,
        style: "destructive",
        onPress: () => void remove(locale),
      },
    ]);

  return (
    <ScrollView
      style={{ backgroundColor: palette.bg }}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: tabBarInset + 24,
        paddingHorizontal: 20,
      }}
    >
      <Text style={[styles.title, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
        {s.brand}
      </Text>

      {/* Account — hidden entirely when sync isn't configured. Signed in: a
          static status row with an inline "Sign out" (no drill-down — the only
          action lives right here). Signed out: a tappable card → the magic-link
          sign-in screen. */}
      {syncAvailable ? (
        signedIn ? (
          <>
            <View style={StyleSheet.flatten([styles.account, { borderColor: palette.divider }])}>
              <Ionicons name="checkmark-circle" size={36} color={palette.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.accountTitle, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
                  {s.signedIn}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.accountSub, { color: palette.ink, fontFamily: FONTS.serif }]}
                >
                  {email ?? s.syncedSub}
                </Text>
              </View>
              <Pressable onPress={() => signOut()} hitSlop={10} accessibilityRole="button">
                <Text style={[styles.signOut, { color: palette.link, fontFamily: FONTS.serif }]}>
                  {s.signOut}
                </Text>
              </Pressable>
            </View>
            <Pressable
              onPress={confirmDeleteAccount}
              hitSlop={8}
              style={styles.deleteAccount}
              accessibilityRole="button"
            >
              <Text style={[styles.deleteAccountText, { fontFamily: FONTS.serif }]}>
                {s.deleteAccount}
              </Text>
            </Pressable>
          </>
        ) : (
          <Link href="/account" asChild>
            <Pressable
              style={StyleSheet.flatten([styles.account, { borderColor: palette.divider }])}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <Ionicons name="person-circle-outline" size={36} color={palette.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.accountTitle, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
                  {s.signInTitle}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.accountSub, { color: palette.ink, fontFamily: FONTS.serif }]}
                >
                  {s.signInSub}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={palette.ink} style={{ opacity: 0.3 }} />
            </Pressable>
          </Link>
        )
      ) : null}

      {/* Settings — Appearance kept inline (single toggle, no screen needed). */}
      <SectionLabel>{s.settings}</SectionLabel>
      <View style={[styles.card, { borderColor: palette.divider }]}>
        <Text style={[styles.cardLabel, { color: palette.ink, fontFamily: FONTS.serif }]}>
          {s.appearance}
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
                  {s[opt.key]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.cardDivider, { borderColor: palette.divider }]} />

        <Text style={[styles.cardLabel, { color: palette.ink, fontFamily: FONTS.serif }]}>
          {s.language}
        </Text>
        <View style={[styles.segRow, { borderColor: palette.divider }]}>
          {SUPPORTED_LOCALES.map((loc) => {
            const active = loc === locale;
            return (
              <Pressable
                key={loc}
                onPress={() => setLocale(loc)}
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
                  {LOCALE_LABELS[loc]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {locale === "zh" ? (
          <>
            <View style={[styles.cardDivider, { borderColor: palette.divider }]} />
            <Text style={[styles.cardLabel, { color: palette.ink, fontFamily: FONTS.serif }]}>
              {script === "hant" ? "簡繁" : "简繁"}
            </Text>
            <View style={[styles.segRow, { borderColor: palette.divider }]}>
              {(
                [
                  ["hans", "简体"],
                  ["hant", "繁體"],
                ] as [ChineseScript, string][]
              ).map(([key, label]) => {
                const active = key === script;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setScript(key)}
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
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}
      </View>

      <SectionLabel>{s.support}</SectionLabel>
      <MenuGroup>
        {/* No donations on iOS — App Review 3.1.1 requires IAP for tips. */}
        {Platform.OS !== "ios" && (
          <MenuRow icon="heart-outline" label={s.donate} href="/donate" />
        )}
        <MenuRow icon="create-outline" label={nav.contribute} href="/contribute" />
        <MenuRow icon="mail-outline" label={s.newsletter} href="/newsletter" />
        <MenuRow
          icon="chatbubble-ellipses-outline"
          label={s.feedback}
          onPress={() =>
            void Linking.openURL(
              "mailto:hello@plaindharma.com?subject=Plain%20Dharma%20feedback",
            )
          }
        />
      </MenuGroup>

      <SectionLabel>{s.aboutSection}</SectionLabel>
      <MenuGroup>
        <MenuRow icon="information-circle-outline" label={s.aboutApp} href="/about" />
        <MenuRow icon="list-outline" label={nav.glossary} href="/glossary" />
        <MenuRow icon="download-outline" label={s.downloadBook} href="/download" />
      </MenuGroup>

      {/* Offline management — only shown once this language's audio is cached. */}
      {downloaded[locale] ? (
        <>
          <SectionLabel>{s.offlineSection}</SectionLabel>
          <MenuGroup>
            <MenuRow
              icon="trash-outline"
              label={s.clearOffline}
              onPress={confirmClearOffline}
            />
          </MenuGroup>
        </>
      ) : null}

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
  signOut: { fontSize: 15 },
  deleteAccount: { alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 4, marginTop: 2 },
  deleteAccountText: { fontSize: 14, color: "#c0392b" },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  cardLabel: { fontSize: 17 },
  cardDivider: { borderTopWidth: StyleSheet.hairlineWidth, marginVertical: 4 },
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
