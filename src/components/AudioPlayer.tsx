"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { AudioManifest, AudioSection } from "@/content/audio";

type Props = {
  manifest: AudioManifest;
  /** Base URL prefix, e.g. "/audio/en/first-talk" — the component appends "/filename.mp3" */
  audioBaseUrl: string;
};

function formatTime(sec: number): string {
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

// Cross-section transition: fade out the last FADE_MS of each section, then
// leave a GAP_MS silence before the next one starts. (Next section starts at
// full volume — fade-in turned out to feel artificial; the gap is enough.)
const FADE_MS = 700;
const GAP_MS = 1400;
const FADE_SEC = FADE_MS / 1000;

export function AudioPlayer({ manifest, audioBaseUrl }: Props) {
  // Per-section `file` is usually a bare filename ("01-opening.mp3"), but the
  // combined /read playlist passes absolute "/audio/.../foo.mp3" paths since
  // its sections live in different per-sutta dirs. Detect and pass through.
  // Memoized so the listener-setup useEffect doesn't tear down and re-attach
  // on every parent re-render (e.g. when the floating popup toggles open).
  const getFileUrl = useCallback(
    (file: string) =>
      file.startsWith("/") || file.startsWith("http")
        ? file
        : `${audioBaseUrl}/${file}`,
    [audioBaseUrl]
  );
  const audioRef = useRef<HTMLAudioElement>(null);
  // True once we've started the end-of-section fade-out; reset on each load.
  const fadeOutStartedRef = useRef(false);
  // Scrolling the active section into the (potentially clipped) list viewport.
  const activeLiRef = useRef<HTMLLIElement>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const sections = manifest.sections;
  const currentSection: AudioSection = sections[currentIdx];

  // Animate audio.volume from its current value to `to` over `durationMs`.
  const fadeVolume = useCallback((to: number, durationMs: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const from = audio.volume;
    const start = performance.now();
    const tick = (now: number) => {
      const el = audioRef.current;
      if (!el) return;
      const t = Math.min(1, (now - start) / durationMs);
      el.volume = Math.max(0, Math.min(1, from + (to - from) * t));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  // Load a section by index
  const loadSection = useCallback(
    (idx: number, autoplay = false) => {
      const audio = audioRef.current;
      if (!audio) return;
      const sec = sections[idx];
      if (!sec) return;
      setCurrentIdx(idx);
      setCurrentTime(0);
      setDuration(0);
      setIsLoaded(false);
      fadeOutStartedRef.current = false;
      audio.volume = 1;
      audio.src = getFileUrl(sec.file);
      audio.load();
      if (autoplay) {
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    },
    [sections, getFileUrl]
  );

  // When the audio element ends, wait a beat for breath, then advance.
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    const nextIdx = currentIdx + 1;
    if (nextIdx < sections.length) {
      window.setTimeout(() => loadSection(nextIdx, true), GAP_MS);
    }
  }, [currentIdx, sections.length, loadSection]);

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Auto-advance only fires fade-out for non-last sections; the very last
      // section also fades to silence naturally for a clean end-of-sutta.
      if (
        !fadeOutStartedRef.current &&
        isFinite(audio.duration) &&
        audio.duration > 0 &&
        audio.currentTime >= audio.duration - FADE_SEC
      ) {
        fadeOutStartedRef.current = true;
        fadeVolume(0, FADE_MS);
      }
    };
    const handleDurationChange = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    const handleCanPlay = () => {
      setIsLoaded(true);
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    // Load the first section on mount (no autoplay)
    if (!audio.src) {
      audio.src = getFileUrl(sections[0].file);
      audio.load();
    }

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [handleEnded, getFileUrl, sections, fadeVolume]);

  // Keep the active section visible in the (possibly scrolled) section list.
  useEffect(() => {
    activeLiRef.current?.scrollIntoView({ block: "nearest" });
  }, [currentIdx]);

  // Scroll the page to the matching anchor whenever the audio enters a new
  // section. Combined-manifest section ids look like "{slug}--{section}";
  // per-sutta manifests use bare ids. Try the full id first (sections wrap
  // themselves on /read with prefixed ids, on /[slug] with bare ids), and
  // fall back to the slug-only anchor for combined manifests so a section
  // missing a wrapper still lands roughly in the right place.
  const initialMountRef = useRef(true);
  useEffect(() => {
    const sec = sections[currentIdx];
    if (!sec) return;
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    const slugOnly = sec.id.includes("--") ? sec.id.split("--")[0] : null;
    const target =
      document.getElementById(sec.id) ??
      (slugOnly ? document.getElementById(slugOnly) : null);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentIdx, sections]);

  // Media Session API integration — gives OS-level controls (lock screen,
  // notification shade, hardware media keys, headphone buttons) and signals
  // to the browser that this is real foreground media so autoplay across
  // section boundaries is more reliable when the tab is backgrounded.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({
      title: currentSection.title,
      artist: "Plain Dharma",
      album: manifest.slug === "all"
        ? "The Buddha's foundational teachings"
        : manifest.slug,
    });

    const actions: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ["play", () => void audioRef.current?.play()],
      ["pause", () => audioRef.current?.pause()],
      [
        "nexttrack",
        () => {
          if (currentIdx + 1 < sections.length) loadSection(currentIdx + 1, true);
        },
      ],
      [
        "previoustrack",
        () => {
          if (currentIdx > 0) loadSection(currentIdx - 1, true);
        },
      ],
      [
        "seekbackward",
        (details) => {
          const a = audioRef.current;
          if (!a) return;
          a.currentTime = Math.max(0, a.currentTime - (details.seekOffset ?? 10));
        },
      ],
      [
        "seekforward",
        (details) => {
          const a = audioRef.current;
          if (!a) return;
          a.currentTime = Math.min(
            isFinite(a.duration) ? a.duration : Infinity,
            a.currentTime + (details.seekOffset ?? 10)
          );
        },
      ],
    ];

    for (const [action, handler] of actions) {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        // Some browsers don't support every action; ignore.
      }
    }

    return () => {
      for (const [action] of actions) {
        try {
          ms.setActionHandler(action, null);
        } catch {
          // ignore
        }
      }
    };
  }, [
    currentSection.title,
    currentIdx,
    sections.length,
    loadSection,
    manifest.slug,
  ]);

  // Mirror playback state so the OS playback indicator stays accurate.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const val = parseFloat(e.target.value);
    audio.currentTime = val;
    setCurrentTime(val);
    // If scrubbing back from inside the end-fade zone, restore full volume so
    // the section doesn't stay silent and let fade-out re-trigger near end.
    const fadeStart = isFinite(audio.duration) ? audio.duration - FADE_SEC : Infinity;
    if (val < fadeStart) {
      fadeOutStartedRef.current = false;
      audio.volume = 1;
    }
  };

  const handleSectionClick = (idx: number) => {
    if (idx === currentIdx) {
      togglePlayPause();
    } else {
      loadSection(idx, true);
      // The page scroll is handled by the currentIdx effect below, which
      // also fires on auto-advance — keeps one source of truth.
    }
  };

  const totalDuration = sections.reduce((n, s) => n + s.duration_sec, 0);

  return (
    <div className="rounded-lg border border-accent/40 bg-paper shadow-xl overflow-hidden">
      {/* Hidden native audio element */}
      <audio ref={audioRef} preload="metadata" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-divider">
        <span className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-ink/50">
          Listen
        </span>
        <span className="font-sans text-xs text-ink/40">
          Voice: {manifest.voice}
        </span>
      </div>

      {/* Playback controls */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-divider">
        {/* Play / Pause button */}
        <button
          onClick={togglePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
          aria-pressed={isPlaying}
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-accent text-white hover:bg-accent-strong transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {isPlaying ? (
            /* Pause icon */
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="w-4 h-4 fill-current"
            >
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            /* Play icon */
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="w-4 h-4 fill-current"
            >
              <path d="M8 5.14v13.72A1 1 0 0 0 9.5 19.8l10.4-6.86a1 1 0 0 0 0-1.66L9.5 4.34A1 1 0 0 0 8 5.14z" />
            </svg>
          )}
        </button>

        {/* Time display */}
        <span className="font-sans text-xs tabular-nums text-ink/60 flex-shrink-0">
          {formatTime(currentTime)}&nbsp;/&nbsp;
          {duration > 0
            ? formatTime(duration)
            : formatTime(currentSection.duration_sec)}
        </span>

        {/* Scrubber */}
        <input
          type="range"
          min={0}
          max={duration > 0 ? duration : currentSection.duration_sec}
          step={0.5}
          value={currentTime}
          onChange={handleScrub}
          aria-label="Seek"
          disabled={!isLoaded}
          className="flex-1 h-1 accent-accent cursor-pointer disabled:opacity-40"
        />
      </div>

      {/* Section list — bounded height so long playlists (e.g. /read's 37
          sections) don't blow out the popup. Scrolls internally; we nudge the
          active section into view on each change. */}
      <ul
        role="list"
        className="divide-y divide-divider max-h-[50vh] overflow-y-auto"
      >
        {sections.map((sec, idx) => {
          const isActive = idx === currentIdx;
          const isThisPlaying = isActive && isPlaying;
          return (
            <li key={sec.id} ref={isActive ? activeLiRef : undefined}>
              <button
                onClick={() => handleSectionClick(idx)}
                aria-pressed={isActive}
                aria-label={`${isActive && isPlaying ? "Pause" : "Play"} section: ${sec.title}`}
                className={[
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                  "hover:bg-accent/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px]",
                  isActive ? "bg-accent/8 text-ink" : "text-ink/80",
                ].join(" ")}
              >
                {/* State icon */}
                <span
                  className={[
                    "flex-shrink-0 w-4 text-center text-sm",
                    isActive ? "text-accent" : "text-ink/30",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {isThisPlaying ? "◉" : "▷"}
                </span>

                {/* Title */}
                <span
                  className={[
                    "flex-1 font-sans text-sm",
                    isActive ? "font-semibold" : "font-normal",
                  ].join(" ")}
                >
                  {sec.title}
                </span>

                {/* Duration */}
                <span className="flex-shrink-0 font-sans text-xs tabular-nums text-ink/40">
                  {isActive && isPlaying
                    ? formatTime(currentTime)
                    : formatTime(sec.duration_sec)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Footer: total */}
      <div className="px-4 py-2 border-t border-divider flex justify-end">
        <span className="font-sans text-xs text-ink/35">
          {sections.length} sections &middot; {formatTime(totalDuration)} total
        </span>
      </div>
    </div>
  );
}
