/**
 * "Highlights & notes" block for the More tab: the sign-in/account card plus a
 * "My notes" button that opens the GLOBAL list of every mark across all suttas,
 * with edit (note + color), share, and delete. Self-contained — owns its own
 * panel / composer / share state so more.tsx stays a simple layout.
 */

import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { getMeta, isSuttaSlug, DEFAULT_LOCALE } from "@plain-dharma/content";
import { useTheme } from "@/theme/ThemeContext";
import { FONTS } from "@/theme/tokens";
import { useMarginalia } from "./AuthContext";
import { MarginNotesPanel } from "./MarginNotesPanel";
import { NoteComposer } from "./NoteComposer";
import { buildSharePayload, type SharePayload } from "./share";
import { ShareSheet } from "./ShareSheet";
import { SignInCard } from "./SignInCard";
import type { MarginMark } from "./types";

export function MyNotesSection() {
  const { palette } = useTheme();
  const { marks, updateMark, remove } = useMarginalia();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<MarginMark | null>(null);
  const [share, setShare] = useState<SharePayload | null>(null);

  const sorted = useMemo(
    () => [...marks].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [marks],
  );

  function shareMark(m: MarginMark) {
    const title =
      isSuttaSlug(m.slug) && getMeta(DEFAULT_LOCALE, m.slug)?.title
        ? `${getMeta(DEFAULT_LOCALE, m.slug).title} · Plain Dharma`
        : "Plain Dharma";
    setPanelOpen(false);
    setShare(
      buildSharePayload(
        m.slug,
        { anchor: m.anchor, quote: m.quote, prefix: m.prefix, suffix: m.suffix },
        title,
      ),
    );
  }

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
        onShare={shareMark}
        onRemove={(id) => remove(id)}
      />

      <NoteComposer
        visible={editing != null}
        quote={editing?.quote ?? ""}
        initialNote={editing?.note ?? null}
        initialColor={editing?.color}
        onSave={(note, color) => {
          if (editing) updateMark(editing.id, { note, color });
          setEditing(null);
        }}
        onCancel={() => setEditing(null)}
      />

      <ShareSheet visible={share != null} payload={share} onClose={() => setShare(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  linkRow: { paddingVertical: 14, borderBottomWidth: 1, marginTop: 8 },
});
