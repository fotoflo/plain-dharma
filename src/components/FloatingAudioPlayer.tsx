"use client";

import { useState, useEffect, useRef } from "react";
import type { AudioManifest } from "@/content/audio";
import type { Locale } from "@/content/index";
import { getStrings } from "@/content/strings";
import { AudioPlayer } from "./AudioPlayer";

type Props = {
  manifest: AudioManifest;
  audioBaseUrl: string;
  locale: Locale;
};

export function FloatingAudioPlayer({ manifest, audioBaseUrl, locale }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const s = getStrings(locale).audio;

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-24 right-4 z-50 sm:bottom-6 sm:right-5 flex flex-col items-end gap-2"
    >
      {/* Keep the player mounted even when collapsed — otherwise closing the
          popup unmounts <audio> and stops playback. Hide visually instead. */}
      <div
        className={`w-[320px] max-w-[calc(100vw-2rem)] ${open ? "" : "hidden"}`}
      >
        <AudioPlayer
          manifest={manifest}
          audioBaseUrl={audioBaseUrl}
          locale={locale}
        />
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? s.closeAudioPlayer : s.openAudioPlayer}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-accent/40 bg-paper/95 px-3 py-2 font-sans text-sm text-accent shadow-md backdrop-blur transition-colors hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
          <path d="M8 5.14v13.72A1 1 0 0 0 9.5 19.8l10.4-6.86a1 1 0 0 0 0-1.66L9.5 4.34A1 1 0 0 0 8 5.14z" />
        </svg>
        {s.listen}
      </button>
    </div>
  );
}
