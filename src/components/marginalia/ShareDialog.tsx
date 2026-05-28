"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MarginaliaStrings } from "./strings";

interface Props {
  url: string;
  quote: string;
  title: string;
  strings: MarginaliaStrings;
  onClose: () => void;
}

/** Light passage-share dialog: copy link, copy passage, native share. No OG
 *  picker, no social-logo row — sharing needs no account on either end. */
export default function ShareDialog({ url, quote, title, strings: t, onClose }: Props) {
  const [copied, setCopied] = useState<"link" | "passage" | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [onClose]);

  // How the link will actually unfurl — read the page's own OG tags. (There's no
  // per-passage OG image, so a shared passage link inherits the page's card.)
  const og = useMemo(() => {
    const meta = (p: string) =>
      document.querySelector(`meta[property="${p}"]`)?.getAttribute("content") ?? "";
    return {
      image: meta("og:image"),
      title: meta("og:title") || document.title,
      description: meta("og:description"),
      domain: window.location.hostname || "plaindharma.com",
    };
  }, []);

  const passageText = `“${quote}”\n\n${title}\n${url}`;

  function copy(what: "link" | "passage") {
    const text = what === "link" ? url : passageText;
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(what);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(null), 1600);
      },
      () => {},
    );
  }

  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <div
      data-mn-ui
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.shareTitle}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-divider bg-paper p-5 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <h3 className="font-serif text-lg text-ink">{t.shareTitle}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="-mt-1 text-2xl leading-none text-ink/50 hover:text-ink"
          >
            &times;
          </button>
        </div>
        <p className="mt-1 font-sans text-xs text-ink/60">{t.shareIntro}</p>
        <blockquote className="mt-3 border-l-2 border-accent/60 pl-3 font-serif text-[0.95rem] italic leading-snug text-ink/80">
          {quote}
        </blockquote>

        {/* How the link unfurls — the page's OG card */}
        <div className="mt-4">
          <div className="mb-1 font-sans text-[0.7rem] uppercase tracking-wide text-ink/45">
            {t.previewLabel}
          </div>
          <div className="overflow-hidden rounded-lg border border-divider">
            {og.image && (
              <div
                className="aspect-[1.91/1] bg-cover bg-center"
                style={{ backgroundImage: `url('${og.image}')` }}
              />
            )}
            <div className="px-3 py-2">
              <div className="font-sans text-[0.7rem] uppercase tracking-wide text-ink/45">
                {og.domain}
              </div>
              <div className="line-clamp-1 font-serif text-sm leading-snug text-ink">{og.title}</div>
              {og.description && (
                <div className="mt-0.5 line-clamp-2 font-sans text-xs leading-snug text-ink/60">
                  {og.description}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 rounded-lg border border-divider bg-paper/60 px-3 py-2 font-sans text-xs text-ink/70 outline-none"
          />
          <button
            type="button"
            onClick={() => copy("link")}
            className="shrink-0 rounded-lg bg-accent px-3 py-2 font-sans text-xs font-medium text-white hover:bg-accent-strong"
          >
            {copied === "link" ? t.copied : t.copyLink}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 font-sans text-sm">
          <button
            type="button"
            onClick={() => copy("passage")}
            className="rounded-lg border border-accent/40 px-3 py-1.5 text-ink/80 hover:border-accent hover:text-accent"
          >
            {copied === "passage" ? t.copied : t.copyPassage}
          </button>
          {canNativeShare && (
            <button
              type="button"
              onClick={() => navigator.share?.({ title, text: `“${quote}”`, url }).catch(() => {})}
              className="rounded-lg border border-accent/40 px-3 py-1.5 text-ink/80 hover:border-accent hover:text-accent"
            >
              {t.shareNative}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
