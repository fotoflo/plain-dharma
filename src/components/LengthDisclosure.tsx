"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// A small "this is a long read" disclosure pill that opens a modal with the
// honest two-line version, for readers deciding whether to commit. Reuses the
// project's accessibility trigger→dialog idiom (see ReadingControls: a pill with
// aria-haspopup="dialog" + aria-expanded, a role="dialog" panel, Escape + click-
// outside to dismiss, focus returned to the trigger on close) and the centered
// modal shell from ZoomableImage (backdrop click closes, body scroll locked).
export function LengthDisclosure({ minutes }: { minutes: number }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Move focus into the dialog so keyboard users land inside it.
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={[
          "group inline-flex items-center gap-2 rounded-full px-3 py-1.5",
          "border border-accent/40 bg-paper/95 shadow-sm backdrop-blur-sm",
          "font-sans text-sm text-ink/70 transition-colors",
          "hover:border-accent hover:text-accent",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        ].join(" ")}
      >
        <span>A long read — about {minutes} minutes</span>
        <span
          aria-hidden="true"
          className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[0.65rem] leading-none"
        >
          i
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="length-disclosure-title"
          onClick={close}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={[
              "relative w-full max-w-md rounded-2xl p-6 sm:p-7",
              "border border-accent/25 bg-paper shadow-md",
            ].join(" ")}
          >
            <h2
              id="length-disclosure-title"
              className="font-serif text-2xl leading-tight text-ink"
            >
              Before you start
            </h2>
            <div className="mt-4 space-y-3 font-sans text-sm leading-relaxed text-ink/75">
              <p>
                This is a long, personal read — about {minutes} minutes. It’s the
                origin story: a 3 a.m. question, a Gen-Z detour that went too
                far, and then the slow work of arguing every phrase against the
                Pāli, by hand.
              </p>
              <p>
                The short version: drafted from the Pāli with Claude, then argued
                line by line by hand, read aloud against the audiobook over and
                over, and released into the public domain under CC0.
              </p>
              <p>
                But the work itself is the point, not the story about it.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/read"
                className="rounded-full bg-accent px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-accent/90"
              >
                Read the six teachings →
              </Link>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="rounded-full border border-accent/40 px-4 py-2 font-sans text-sm text-ink/70 transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                Keep reading
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
