"use client";

import { useState, useEffect, useRef } from "react";
import type { AudioManifest } from "@/content/audio";
import { AudioPlayer } from "./AudioPlayer";

type Props = {
  manifest: AudioManifest;
  audioBaseUrl: string;
};

export function FloatingAudioPlayer({ manifest, audioBaseUrl }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      className="fixed bottom-24 right-4 z-50 sm:bottom-auto sm:top-36 sm:right-5 flex flex-col items-end gap-2"
    >
      {open && (
        <div className="w-[320px] max-w-[calc(100vw-2rem)]">
          <AudioPlayer manifest={manifest} audioBaseUrl={audioBaseUrl} />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close audio player" : "Open audio player"}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-accent/40 bg-paper/95 px-3 py-2 font-sans text-sm text-accent shadow-md backdrop-blur transition-colors hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
          <path d="M8 5.14v13.72A1 1 0 0 0 9.5 19.8l10.4-6.86a1 1 0 0 0 0-1.66L9.5 4.34A1 1 0 0 0 8 5.14z" />
        </svg>
        Listen
      </button>
    </div>
  );
}
