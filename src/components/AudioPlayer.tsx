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

export function AudioPlayer({ manifest, audioBaseUrl }: Props) {
  const getFileUrl = (file: string) => `${audioBaseUrl}/${file}`;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const sections = manifest.sections;
  const currentSection: AudioSection = sections[currentIdx];

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

  // When the audio element ends, advance to next section
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    const nextIdx = currentIdx + 1;
    if (nextIdx < sections.length) {
      loadSection(nextIdx, true);
    }
  }, [currentIdx, sections.length, loadSection]);

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
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
  }, [handleEnded, getFileUrl, sections]);

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
  };

  const handleSectionClick = (idx: number) => {
    if (idx === currentIdx) {
      togglePlayPause();
    } else {
      loadSection(idx, true);
      // Optional: scroll to section heading
      const sec = sections[idx];
      const el = document.getElementById(sec.id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const totalDuration = sections.reduce((n, s) => n + s.duration_sec, 0);

  return (
    <div className="rounded-lg border border-accent/40 bg-paper shadow-xl overflow-hidden">
      {/* Hidden native audio element */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
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

      {/* Section list */}
      <ul role="list" className="divide-y divide-divider">
        {sections.map((sec, idx) => {
          const isActive = idx === currentIdx;
          const isThisPlaying = isActive && isPlaying;
          return (
            <li key={sec.id}>
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
