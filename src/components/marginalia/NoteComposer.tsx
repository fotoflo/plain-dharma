"use client";

import { useEffect, useRef, useState } from "react";
import type { MarginaliaStrings } from "./strings";

interface Props {
  quote: string;
  initialNote?: string;
  strings: MarginaliaStrings;
  onSave: (note: string) => void;
  onCancel: () => void;
}

/** Modal for writing/editing a private note on a passage. */
export default function NoteComposer({
  quote,
  initialNote = "",
  strings: t,
  onSave,
  onCancel,
}: Props) {
  const [note, setNote] = useState(initialNote);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      data-mn-ui
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.noteTitle}
        className="w-full max-w-md rounded-2xl border border-divider bg-paper p-5 shadow-xl"
      >
        <h3 className="font-sans text-xs font-medium uppercase tracking-wide text-ink/60">
          {t.noteTitle}
        </h3>
        <blockquote className="mt-3 border-l-2 border-accent/60 pl-3 font-serif text-[0.95rem] italic leading-snug text-ink/80">
          {quote}
        </blockquote>
        <textarea
          ref={ref}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.notePlaceholder}
          className="mt-4 h-28 w-full resize-none rounded-lg border border-divider bg-paper/60 p-3 font-sans text-sm text-ink outline-none focus:border-accent"
        />
        <div className="mt-4 flex justify-end gap-2 font-sans text-sm">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-ink/70 hover:text-ink"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => onSave(note.trim())}
            className="rounded-lg bg-accent px-4 py-1.5 font-medium text-white hover:bg-accent-strong"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
