/**
 * "Want to keep this?" nudge — the mobile counterpart of the web's SavePrompt,
 * shown once after the reader's first mark while signed out. Same microcopy
 * (strings.ts), same one-tap-link flow: enter email → Supabase magic link →
 * "check your inbox". Dismissing it leaves the More-tab sign-in card as the
 * permanent off-ramp.
 *
 * Rendered as a centered modal (RN has no fixed-position banner); a "shown"
 * flag in AsyncStorage means it only ever appears once, mirroring the web's
 * `pd-mn-prompt` localStorage guard.
 */

import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";
import { MARGINALIA_STRINGS as t } from "./strings";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SavePrompt({
  visible,
  onSend,
  onDismiss,
}: {
  visible: boolean;
  onSend: (email: string) => Promise<{ ok: boolean; error?: string }>;
  onDismiss: () => void;
}) {
  const { palette } = useTheme();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit() {
    if (status === "sending") return;
    if (!EMAIL_RE.test(email.trim())) {
      setError(t.errorEmail);
      setStatus("error");
      return;
    }
    setStatus("sending");
    const res = await onSend(email.trim());
    if (res.ok) setStatus("sent");
    else {
      setError(res.error || t.errorGeneric);
      setStatus("error");
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kav}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: palette.bg, borderColor: palette.divider }]}
            onPress={(e) => e.stopPropagation()}
          >
            {status === "sent" ? (
              <>
                <Text style={[styles.h, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
                  {t.savePromptSentTitle}
                </Text>
                <Text style={[styles.body, { color: palette.ink }]}>{t.savePromptSentBody}</Text>
                <View style={styles.rightRow}>
                  <Pressable onPress={onDismiss} hitSlop={8}>
                    <Text style={{ color: palette.link, fontFamily: FONTS.serif, fontSize: 16 }}>
                      {t.close}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.h, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
                  {t.savePromptTitle}
                </Text>
                <Text style={[styles.body, { color: palette.ink }]}>{t.savePromptBody}</Text>
                <Text style={[styles.reassure, { color: palette.ink }]}>
                  {t.savePromptReassure}
                </Text>
                <View style={styles.row}>
                  <TextInput
                    value={email}
                    onChangeText={(v) => {
                      setEmail(v);
                      if (status === "error") setStatus("idle");
                    }}
                    placeholder={t.emailPlaceholder}
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
                    onPress={submit}
                    disabled={status === "sending"}
                    style={[
                      styles.btn,
                      { backgroundColor: palette.accentStrong, opacity: status === "sending" ? 0.6 : 1 },
                    ]}
                  >
                    <Text style={{ color: palette.onAccent, fontFamily: FONTS.serif, fontSize: 15 }}>
                      {status === "sending" ? t.sending : t.savePromptSend}
                    </Text>
                  </Pressable>
                </View>
                {status === "error" ? <Text style={styles.err}>{error}</Text> : null}
                <View style={styles.rightRow}>
                  <Pressable onPress={onDismiss} hitSlop={8}>
                    <Text style={{ color: palette.ink, opacity: 0.55, fontFamily: FONTS.serif, fontSize: 14 }}>
                      {t.savePromptDismiss}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 20 },
  kav: { width: "100%" },
  sheet: { borderRadius: 14, borderWidth: 1, padding: 20, gap: 10 },
  h: { fontSize: 20 },
  body: { fontSize: 15, opacity: 0.7, lineHeight: 22 },
  reassure: { fontSize: 13, opacity: 0.55 },
  row: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 4 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  btn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, alignItems: "center", justifyContent: "center" },
  err: { color: "#c0392b", fontSize: 13, marginTop: 2 },
  rightRow: { alignItems: "flex-end" },
});
