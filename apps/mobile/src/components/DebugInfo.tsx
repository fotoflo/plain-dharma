import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color }]}>{label}</Text>
      <Text style={[styles.rowValue, { color }]} selectable numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

// Diagnostics block for the More tab: app/build version, the OTA channel +
// runtime, which update is actually running (embedded vs a downloaded OTA), and
// buttons to check for / apply an update. Pure JS over the already-native
// expo-updates module, so it ships fine over OTA. Collapsed by default.
export function DebugInfo() {
  const { palette } = useTheme();
  const {
    currentlyRunning,
    availableUpdate,
    isUpdateAvailable,
    isUpdatePending,
    isChecking,
    isDownloading,
    lastCheckForUpdateTimeSinceRestart,
    checkError,
    downloadError,
  } = Updates.useUpdates();

  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  const fmt = (d?: Date | null) =>
    d ? new Date(d).toLocaleString() : "—";

  const runningLabel = currentlyRunning.isEmbeddedLaunch
    ? "Embedded (built into this build)"
    : (currentlyRunning.updateId ?? "—");

  const checkNow = async () => {
    if (__DEV__) {
      Alert.alert("Not available in dev", "OTA updates are disabled in development builds.");
      return;
    }
    setBusy(true);
    try {
      const res = await Updates.checkForUpdateAsync();
      Alert.alert(
        res.isAvailable ? "Update available" : "Up to date",
        res.isAvailable
          ? "A new update is available. Tap “Download & restart” to apply it."
          : "You’re running the latest update."
      );
    } catch (e) {
      Alert.alert("Check failed", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const applyNow = async () => {
    if (__DEV__) {
      Alert.alert("Not available in dev", "OTA updates are disabled in development builds.");
      return;
    }
    setBusy(true);
    try {
      if (!isUpdatePending) await Updates.fetchUpdateAsync();
      await Updates.reloadAsync(); // restarts into the new update
    } catch (e) {
      setBusy(false);
      Alert.alert("Update failed", e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <View style={{ marginTop: 28 }}>
      <Pressable onPress={() => setExpanded((v) => !v)}>
        <Text style={[styles.h, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
          Build & updates {expanded ? "▾" : "▸"}
        </Text>
      </Pressable>

      {expanded ? (
        <View style={[styles.card, { borderColor: palette.divider }]}>
          <Row label="App version" value={Constants.expoConfig?.version ?? "—"} color={palette.ink} />
          <Row label="Runtime" value={currentlyRunning.runtimeVersion ?? "—"} color={palette.ink} />
          <Row label="Channel" value={currentlyRunning.channel ?? "—"} color={palette.ink} />
          <Row label="Running update" value={runningLabel} color={palette.ink} />
          <Row label="Update created" value={fmt(currentlyRunning.createdAt)} color={palette.ink} />
          <Row
            label="Update available"
            color={palette.ink}
            value={
              isUpdatePending
                ? "Downloaded — restart to apply"
                : isUpdateAvailable
                  ? (availableUpdate?.updateId ?? "yes")
                  : "no"
            }
          />
          <Row label="Last checked" value={fmt(lastCheckForUpdateTimeSinceRestart)} color={palette.ink} />
          {checkError ? <Row label="Check error" value={checkError.message} color={palette.ink} /> : null}
          {downloadError ? <Row label="Download error" value={downloadError.message} color={palette.ink} /> : null}

          <View style={styles.btnRow}>
            <Pressable
              onPress={checkNow}
              disabled={busy || isChecking}
              style={[styles.btn, { borderColor: palette.accent, opacity: busy || isChecking ? 0.5 : 1 }]}
            >
              {isChecking ? (
                <ActivityIndicator color={palette.accent} size="small" />
              ) : (
                <Text style={{ color: palette.accent, fontFamily: FONTS.serif }}>Check for update</Text>
              )}
            </Pressable>

            {isUpdateAvailable || isUpdatePending ? (
              <Pressable
                onPress={applyNow}
                disabled={busy}
                style={[styles.btn, { backgroundColor: palette.accentStrong, opacity: busy ? 0.5 : 1 }]}
              >
                {isDownloading || busy ? (
                  <ActivityIndicator color={palette.onAccent} size="small" />
                ) : (
                  <Text style={{ color: palette.onAccent, fontFamily: FONTS.serif }}>Download & restart</Text>
                )}
              </Pressable>
            ) : null}
          </View>

          {__DEV__ ? (
            <Text style={[styles.devNote, { color: palette.ink }]}>
              OTA is disabled in development builds.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  h: { fontSize: 24, marginBottom: 6 },
  card: { borderWidth: 1, borderRadius: 10, padding: 14, marginTop: 4, gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  rowLabel: { fontSize: 13, opacity: 0.6 },
  rowValue: { fontSize: 13, flexShrink: 1, textAlign: "right" },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  btn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  devNote: { fontSize: 12, opacity: 0.5, marginTop: 4 },
});
