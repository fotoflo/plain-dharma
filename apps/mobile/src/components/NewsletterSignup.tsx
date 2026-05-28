import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { subscribe } from "@/lib/newsletter";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

type Status = "idle" | "loading" | "done" | "error";

export function NewsletterSignup() {
  const { palette } = useTheme();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const onSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || status === "loading") return;
    setStatus("loading");
    const res = await subscribe(trimmed);
    if (res.ok) {
      setStatus("done");
      setMessage(
        res.alreadySubscribed
          ? "You're already subscribed."
          : "Thanks — you're on the list."
      );
      if (!res.alreadySubscribed) setEmail("");
    } else {
      setStatus("error");
      setMessage(res.error);
    }
  };

  return (
    <View>
      <TextInput
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          if (status !== "idle") setStatus("idle");
        }}
        placeholder="you@example.com"
        placeholderTextColor={`${palette.ink}80`}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        style={[styles.input, { color: palette.ink, borderColor: palette.divider }]}
      />
      <Pressable
        onPress={onSubmit}
        disabled={status === "loading"}
        style={[styles.btn, { backgroundColor: palette.accentStrong }]}
      >
        {status === "loading" ? (
          <ActivityIndicator color={palette.onAccent} />
        ) : (
          <Text style={{ color: palette.onAccent, fontFamily: FONTS.serif, fontSize: 16 }}>
            Subscribe
          </Text>
        )}
      </Pressable>
      {message ? (
        <Text
          style={{
            marginTop: 8,
            color: status === "error" ? "#c0392b" : palette.ink,
            opacity: status === "error" ? 1 : 0.7,
          }}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  btn: {
    marginTop: 10,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
  },
});
