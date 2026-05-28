"use client";

import { useEffect, useState } from "react";
import type { MarginMark } from "./types";
import type { MarginaliaStrings } from "./strings";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  open: boolean;
  marks: MarginMark[];
  signedIn: boolean;
  email: string | null;
  strings: MarginaliaStrings;
  onClose: () => void;
  onJump: (mark: MarginMark) => void;
  onRemove: (id: string) => void;
  onEditNote: (mark: MarginMark) => void;
  onSync: (email: string) => Promise<{ ok: boolean; error?: string }>;
  onSignOut: () => void;
}

/** Slide-in drawer listing the reader's marks for this page, with a persistent
 *  "keep these safe" off-ramp at the bottom (or signed-in status). */
export default function MarginNotesPanel({
  open,
  marks,
  signedIn,
  email,
  strings: t,
  onClose,
  onJump,
  onRemove,
  onEditNote,
  onSync,
  onSignOut,
}: Props) {
  const [syncEmail, setSyncEmail] = useState("");
  const [syncStatus, setSyncStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function doSync() {
    if (!EMAIL_RE.test(syncEmail.trim())) {
      setSyncStatus("error");
      return;
    }
    setSyncStatus("sending");
    const res = await onSync(syncEmail.trim());
    setSyncStatus(res.ok ? "sent" : "error");
  }

  return (
    <div
      data-mn-ui
      className="fixed inset-0 z-[58]"
      role="dialog"
      aria-modal="true"
      aria-label={t.panelTitle}
    >
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-[min(22rem,100vw)] flex-col border-l border-divider bg-paper shadow-xl">
        <header className="flex items-center justify-between border-b border-divider px-5 py-4">
          <h2 className="font-serif text-lg text-ink">{t.panelTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="-mt-1 text-2xl leading-none text-ink/50 hover:text-ink"
          >
            &times;
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {marks.length === 0 ? (
            <div className="mt-8 text-center font-sans text-sm text-ink/55">
              <p>{t.panelEmpty}</p>
              <p className="mt-2 text-xs">{t.panelEmptyHint}</p>
            </div>
          ) : (
            <ul className="space-y-5">
              {marks.map((m) => (
                <li key={m.id} className="group">
                  <button
                    type="button"
                    onClick={() => onJump(m)}
                    className="block w-full text-left"
                  >
                    <span className="block border-l-2 border-accent/60 pl-3 font-serif text-[0.95rem] italic leading-snug text-ink/85 line-clamp-3">
                      {m.quote}
                    </span>
                  </button>
                  {m.note ? (
                    <p className="mt-1 pl-3 font-sans text-sm leading-relaxed text-ink/70">{m.note}</p>
                  ) : (
                    <p className="mt-1 pl-3 font-sans text-[0.7rem] uppercase tracking-wide text-ink/40">
                      {t.noteless}
                    </p>
                  )}
                  <div className="mt-1 flex gap-3 pl-3 font-sans text-xs text-ink/45 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <button type="button" onClick={() => onEditNote(m)} className="hover:text-accent">
                      {m.note ? t.editNote : t.addNote}
                    </button>
                    <button type="button" onClick={() => onRemove(m.id)} className="hover:text-destructive">
                      {t.remove}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-divider px-5 py-4 font-sans text-sm">
          {signedIn ? (
            <div className="flex items-center justify-between text-ink/60">
              <span className="truncate">
                {t.signedInAs}
                {email ? ` · ${email}` : ""}
              </span>
              <button type="button" onClick={onSignOut} className="ml-3 shrink-0 text-link hover:text-accent">
                {t.signOut}
              </button>
            </div>
          ) : syncStatus === "sent" ? (
            <p className="text-ink/65">{t.savePromptSentBody}</p>
          ) : (
            <>
              <p className="mb-2 text-xs text-ink/60">{t.syncKeep}</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  doSync();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="email"
                  value={syncEmail}
                  placeholder={t.emailPlaceholder}
                  onChange={(e) => {
                    setSyncEmail(e.target.value);
                    if (syncStatus === "error") setSyncStatus("idle");
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-divider bg-paper/60 px-3 py-1.5 text-sm text-ink outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={syncStatus === "sending"}
                  className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-strong disabled:opacity-60"
                >
                  {t.savePromptSend}
                </button>
              </form>
              {syncStatus === "error" && (
                <p className="mt-1 text-xs text-destructive">{t.errorGeneric}</p>
              )}
            </>
          )}
        </footer>
      </aside>
    </div>
  );
}
