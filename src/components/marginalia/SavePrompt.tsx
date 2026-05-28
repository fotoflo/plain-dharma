"use client";

import { useEffect, useRef, useState } from "react";
import type { MarginaliaStrings } from "./strings";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  strings: MarginaliaStrings;
  onSend: (email: string) => Promise<{ ok: boolean; error?: string }>;
  onDismiss: () => void;
}

/** The "Want to keep this?" card — shown once after the reader's first mark. */
export default function SavePrompt({ strings: t, onSend, onDismiss }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  async function submit() {
    if (status === "sending") return;
    if (!EMAIL_RE.test(email.trim())) {
      setError(t.errorGeneric);
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
    <div
      data-mn-ui
      role="dialog"
      aria-label={t.savePromptTitle}
      className="fixed bottom-4 left-1/2 z-[55] w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-divider bg-paper/97 p-5 shadow-xl backdrop-blur-sm"
    >
      {status === "sent" ? (
        <>
          <h3 className="font-serif text-lg text-ink">{t.savePromptSentTitle}</h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-ink/70">{t.savePromptSentBody}</p>
          <div className="mt-3 text-right">
            <button
              type="button"
              onClick={onDismiss}
              className="font-sans text-sm text-link hover:text-accent"
            >
              {t.close}
            </button>
          </div>
        </>
      ) : (
        <>
          <h3 className="font-serif text-lg text-ink">{t.savePromptTitle}</h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-ink/70">{t.savePromptBody}</p>
          <p className="mt-2 font-sans text-xs text-ink/55">{t.savePromptReassure}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="mt-3 flex items-center gap-2"
          >
            <input
              ref={ref}
              type="email"
              value={email}
              autoComplete="email"
              placeholder={t.emailPlaceholder}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              className="min-w-0 flex-1 rounded-lg border border-divider bg-paper/60 px-3 py-2 font-sans text-sm text-ink outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="shrink-0 rounded-lg bg-accent px-4 py-2 font-sans text-sm font-medium text-white hover:bg-accent-strong disabled:opacity-60"
            >
              {t.savePromptSend}
            </button>
          </form>
          {status === "error" && <p className="mt-2 font-sans text-xs text-destructive">{error}</p>}
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={onDismiss}
              className="font-sans text-xs text-ink/55 hover:text-ink"
            >
              {t.savePromptDismiss}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
