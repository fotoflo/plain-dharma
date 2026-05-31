/**
 * "Highlights & notes" block for the More tab: the sign-in/account card plus a
 * "My notes" button that opens the GLOBAL list of every mark across all suttas,
 * with edit (note) and delete. Self-contained — owns its own panel + composer
 * state so more.tsx stays a simple layout.
 */

import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";
import { useMarginalia } from "./AuthContext";
import { MarginNotesPanel } from "./MarginNotesPanel";
import { NoteComposer } from "./NoteComposer";
import { SignInCard } from "./SignInCard";
import type { MarginMark } from "./types";

export function MyNotesSection() {
  const { palette } = useTheme();
  const { marks, updateNote, remove } = useMarginalia();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<MarginMark | null>(null);

  const sorted = useMemo(
    () =>
      [...marks].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [marks],
  );

  return (
    <>
      <SignInCard />

      <Pressable
        onPress={() => setPanelOpen(true)}
        style={[styles.linkRow, { borderColor: palette.divider }]}
      >
        <Text style={{ color: palette.link, fontFamily: FONTS.serif, fontSize: 17 }}>
          My notes & highlights{marks.length ? ` (${marks.length})` : ""} →
        </Text>
      </Pressable>

      <MarginNotesPanel
        visible={panelOpen}
        title="My notes & highlights"
        marks={sorted}
        showSlug
        onClose={() => setPanelOpen(false)}
        onEdit={(m) => {
          setPanelOpen(false);
          setEditing(m);
        }}
        onRemove={(id) => remove(id)}
      />

      <NoteComposer
        visible={editing != null}
        quote={editing?.quote ?? ""}
        initialNote={editing?.note ?? null}
        onSave={(note) => {
          if (editing) updateNote(editing.id, note);
          setEditing(null);
        }}
        onCancel={() => setEditing(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  linkRow: { paddingVertical: 14, borderBottomWidth: 1, marginTop: 8 },
});
