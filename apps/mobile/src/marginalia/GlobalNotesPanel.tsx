/**
 * The GLOBAL "My notes & highlights" list — every mark across all suttas, with
 * edit (note + color), share, and delete. Self-contained: owns its own composer
 * and share-sheet state. Controlled visibility so it can be opened from
 * anywhere (currently the reader's per-talk panel footer, via `onShowAll`).
 *
 * Was previously a "More" tab section (MyNotesSection); the reader is now the
 * home for the reader's own content (see docs/architecture/more-tab-refactor.md).
 */

import { getMeta, isSuttaSlug, DEFAULT_LOCALE } from "@plain-dharma/content";
import { useMemo, useState } from "react";

import { useMarginalia } from "./AuthContext";
import { MarginNotesPanel } from "./MarginNotesPanel";
import { NoteComposer } from "./NoteComposer";
import { buildSharePayload, type SharePayload } from "./share";
import { ShareSheet } from "./ShareSheet";
import type { MarginMark } from "./types";

export function GlobalNotesPanel({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { marks, updateMark, remove } = useMarginalia();
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
    onClose();
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
      <MarginNotesPanel
        visible={visible}
        title="My notes & highlights"
        marks={sorted}
        showSlug
        onClose={onClose}
        onEdit={(m) => {
          onClose();
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
