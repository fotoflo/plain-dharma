/**
 * Sign-in / account block for the More tab.
 *
 * Signed out: a short pitch + email field + "Send magic link" → "check your
 * email" confirmation. Signed in: shows the email + "Sign out".
 * Hidden entirely when Supabase sync isn't configured (no env), so the app
 * never shows a dead sign-in box.
 */

import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useMarginalia } from "./AuthContext";
import { MARGINALIA_STRINGS as t } from "./strings";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInCard() {
  const { palette } = useTheme();
  const { signedIn, email, syncAvailable, signInWithEmail, signOut } = useMarginalia();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!syncAvailable) return null;

  async function send() {
    const mail = input.trim();
    if (!EMAIL_RE.test(mail)) {
      setStatus("error");
      setErrorMsg(t.errorEmail);
      return;
    }
    setStatus("sending");
    setErrorMsg(null);
    const res = await signInWithEmail(mail);
    if (res.ok) {
      setStatus("sent");
    } else {
      setStatus("error");
      setErrorMsg(res.error ?? t.errorGeneric);
    }
  }

  if (signedIn) {
    return (
      <View style={[styles.card, { borderColor: palette.divider }]}>
        <Text style={[styles.note, { color: palette.ink }]}>
          {t.signedInAs}
          {email ? ` · ${email}` : ""}
        </Text>
        <Pressable onPress={() => signOut()} hitSlop={8}>
          <Text style={{ color: palette.link, fontFamily: FONTS.serif, fontSize: 16 }}>
            {t.signOut}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (status === "sent") {
    return (
      <View style={[styles.card, { borderColor: palette.divider }]}>
        <Text style={[styles.h, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
          {t.savePromptSentTitle}
        </Text>
        <Text style={[styles.note, { color: palette.ink }]}>{t.savePromptSentBody}</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={[styles.note, { color: palette.ink }]}>{t.signInPitch}</Text>
      <View style={styles.row}>
        <TextInput
          value={input}
          onChangeText={(t) => {
            setInput(t);
            if (status === "error") setStatus("idle");
          }}
          placeholder="you@example.com"
          placeholderTextColor={palette.ink + "66"}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          inputMode="email"
          style={[
            styles.input,
            { color: palette.ink, borderColor: palette.divider, fontFamily: FONTS.serif },
          ]}
        />
        <Pressable
          onPress={send}
          disabled={status === "sending"}
          style={[
            styles.btn,
            { backgroundColor: palette.accentStrong, opacity: status === "sending" ? 0.6 : 1 },
          ]}
        >
          <Text style={{ color: palette.onAccent, fontFamily: FONTS.serif, fontSize: 15 }}>
            {status === "sending" ? t.sending : t.sendMagicLink}
          </Text>
        </Pressable>
      </View>
      {status === "error" && errorMsg ? (
        <Text style={[styles.err]}>{errorMsg}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    gap: 8,
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  h: { fontSize: 18 },
  note: { fontSize: 15, opacity: 0.7, marginBottom: 10, lineHeight: 22 },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  btn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  err: { color: "#c0392b", fontSize: 13, marginTop: 6 },
});
