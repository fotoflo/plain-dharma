"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { AudioManifest, AudioSection } from "@/content/audio";
import type { Locale } from "@/content/index";
import { getStrings } from "@/content/strings";

type Props = {
  manifest: AudioManifest;
  /** Base URL prefix, e.g. "/audio/en/first-talk" — the component appends "/filename.mp3" */
  audioBaseUrl: string;
  locale: Locale;
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

// Playback pace. "slow" = the default -20% meditative rendition (per-section
// `file`); "fast" = the optional -7.5% rendition (`fileFast`). The speed
// control only appears when a fast variant exists for the manifest.
type Speed = "slow" | "fast";

export function AudioPlayer({ manifest, audioBaseUrl, locale }: Props) {
  const s = getStrings(locale).audio;
  // Resolve a section to its mp3 URL for the given pace. A section's `file`
  // (slow) is usually a bare filename ("01-opening.mp3"), but the combined
  // /read playlist passes absolute "/audio/.../foo.mp3" paths since its
  // sections live in different per-sutta dirs — detect and pass through.
  // `fileFast` mirrors that shape. Takes the pace explicitly (rather than
  // closing over `speed`) so it stays stable across pace changes.
  const sectionUrl = useCallback(
    (sec: AudioSection, pace: Speed) => {
      const file = pace === "fast" && sec.fileFast ? sec.fileFast : sec.file;
      return file.startsWith("/") || file.startsWith("http")
        ? file
        : `${audioBaseUrl}/${file}`;
    },
    [audioBaseUrl]
  );
  // Only offer the speed control when the manifest actually has a fast variant
  // (e.g. en). Locales without one (zh) get no control and play at slow pace.
  const hasFast = manifest.sections.some((sec) => sec.fileFast);
  const audioRef = useRef<HTMLAudioElement>(null);
  // True once we've started the end-of-section fade-out; reset on each load.
  const fadeOutStartedRef = useRef(false);
  // True during the brief gap between a section ending and the next one
  // starting on auto-advance. Keeps the player UI up (suppresses the flip to
  // the TOC) and ignores the intervening pause/load events.
  const autoAdvancingRef = useRef(false);
  // Scrolling the active section into the (potentially clipped) list viewport.
  const activeLiRef = useRef<HTMLLIElement>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [speed, setSpeed] = useState<Speed>("slow");

  const sections = manifest.sections;
  const currentSection: AudioSection = sections[currentIdx];

  // A section's listed duration depends on the active pace.
  const secDuration = useCallback(
    (sec: AudioSection) =>
      speed === "fast" && sec.duration_fast_sec
        ? sec.duration_fast_sec
        : sec.duration_sec,
    [speed]
  );

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
      // A programmatic load that will resume playback (auto-advance, or
      // prev/next while playing) calls audio.load(), which fires a `pause`
      // event. Flag it so handlePause doesn't flip the UI back to the TOC.
      if (autoplay) autoAdvancingRef.current = true;
      setCurrentIdx(idx);
      setCurrentTime(0);
      setDuration(0);
      setIsLoaded(false);
      fadeOutStartedRef.current = false;
      audio.volume = 1;
      audio.src = sectionUrl(sec, speed);
      audio.load();
      if (autoplay) {
        audio
          .play()
          .then(() => {
            autoAdvancingRef.current = false;
            setIsPlaying(true);
          })
          .catch(() => {
            autoAdvancingRef.current = false;
            setIsPlaying(false);
          });
      }
    },
    [sections, sectionUrl, speed]
  );

  // Switch pace in place: reload the current section at the new speed,
  // preserving the fractional play position and resuming if it was playing.
  const changeSpeed = useCallback(
    (next: Speed) => {
      if (next === speed) return;
      setSpeed(next);
      const audio = audioRef.current;
      const sec = sections[currentIdx];
      if (!audio || !sec) return;
      const frac =
        isFinite(audio.duration) && audio.duration > 0
          ? audio.currentTime / audio.duration
          : 0;
      const wasPlaying = !audio.paused;
      // Same as loadSection: the reload fires a `pause` event. If we're going
      // to resume, suppress the flip to the TOC.
      if (wasPlaying) autoAdvancingRef.current = true;
      fadeOutStartedRef.current = false;
      audio.volume = 1;
      audio.src = sectionUrl(sec, next);
      audio.load();
      const onMeta = () => {
        audio.removeEventListener("loadedmetadata", onMeta);
        if (isFinite(audio.duration)) {
          audio.currentTime = frac * audio.duration;
          setCurrentTime(audio.currentTime);
        }
        if (wasPlaying) {
          audio
            .play()
            .then(() => {
              autoAdvancingRef.current = false;
            })
            .catch(() => {
              autoAdvancingRef.current = false;
            });
        }
      };
      audio.addEventListener("loadedmetadata", onMeta);
    },
    [speed, sections, currentIdx, sectionUrl]
  );

  // When the audio element ends, wait a beat for breath, then advance.
  const handleEnded = useCallback(() => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < sections.length) {
      // Auto-advance: keep the player UI visible through the silent gap rather
      // than flashing back to the TOC and in again. autoAdvancingRef tells the
      // pause handler to ignore the intervening pause/load events.
      autoAdvancingRef.current = true;
      window.setTimeout(() => loadSection(nextIdx, true), GAP_MS);
    } else {
      // End of the playlist — nothing to advance to, so return to the TOC.
      setIsPlaying(false);
    }
  }, [currentIdx, sections.length, loadSection]);

  const togglePlayPause = useCallback(() => {
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
  }, [isPlaying]);

  const goPrev = useCallback(() => {
    if (currentIdx > 0) loadSection(currentIdx - 1, isPlaying);
  }, [currentIdx, loadSection, isPlaying]);

  const goNext = useCallback(() => {
    if (currentIdx + 1 < sections.length)
      loadSection(currentIdx + 1, isPlaying);
  }, [currentIdx, sections.length, loadSection, isPlaying]);

  const seekBy = useCallback((deltaSec: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const max = isFinite(audio.duration) ? audio.duration : Infinity;
    const next = Math.min(max, Math.max(0, audio.currentTime + deltaSec));
    audio.currentTime = next;
    setCurrentTime(next);
    // Same fade-restore as handleScrub: stepping back from the fade zone should
    // bring volume back up and let the end-of-section fade re-trigger.
    const fadeStart = isFinite(audio.duration) ? audio.duration - FADE_SEC : Infinity;
    if (next < fadeStart) {
      fadeOutStartedRef.current = false;
      audio.volume = 1;
    }
  }, []);

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
    const handlePause = () => {
      // During auto-advance the element pauses/reloads between sections; keep
      // the player UI up instead of flashing back to the TOC.
      if (autoAdvancingRef.current) return;
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    // Load the first section on mount (no autoplay)
    if (!audio.src) {
      audio.src = sectionUrl(sections[0], speed);
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
  }, [handleEnded, sectionUrl, speed, sections, fadeVolume]);

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
      ["nexttrack", goNext],
      ["previoustrack", goPrev],
      ["seekbackward", (details) => seekBy(-(details.seekOffset ?? 10))],
      ["seekforward", (details) => seekBy(details.seekOffset ?? 10)],
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
  }, [currentSection.title, manifest.slug, goNext, goPrev, seekBy]);

  // Mirror playback state so the OS playback indicator stays accurate.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

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

  const totalDuration = sections.reduce((n, sec) => n + secDuration(sec), 0);

  const effectiveDuration = duration > 0 ? duration : secDuration(currentSection);

  // Pace control (Slower/Faster). Rendered inside the player body / TOC footer
  // rather than the header so it gets its own breathing room. Only shown when a
  // fast variant exists for this manifest (en); absent for zh.
  const paceControl = hasFast ? (
    <div
      role="group"
      aria-label={s.pace}
      className="flex items-center gap-0.5 rounded-full border border-divider py-0.5 pl-1.5 pr-0.5"
    >
      {/* Speedometer icon — affordance that this control sets pace. */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="mr-0.5 h-3.5 w-3.5 fill-current text-ink/40"
      >
        <path d="M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44z" />
        <path d="M10.59 15.41a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z" />
      </svg>
      {(
        [
          ["slow", s.slower],
          ["fast", s.faster],
        ] as const
      ).map(([val, label]) => (
        <button
          key={val}
          type="button"
          aria-pressed={speed === val}
          onClick={() => changeSpeed(val)}
          className={[
            "rounded-full px-2.5 py-0.5 font-sans text-[11px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
            speed === val ? "bg-accent text-white" : "text-ink/55 hover:text-ink",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className="rounded-lg border border-accent/40 bg-paper shadow-xl overflow-hidden">
      {/* Hidden native audio element */}
      <audio ref={audioRef} preload="metadata" />

      {/* Header: label + (in player mode) a close-player button that pauses and
          returns to the TOC. The popup itself stays open. The pace control lives
          in the body/footer (below), not here. */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-divider">
        <span className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-ink/50">
          {isPlaying ? s.nowPlaying : s.listen}
        </span>
        {isPlaying && (
          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={s.closePlayer}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-ink/60 hover:bg-accent/10 hover:text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current">
              <path d="M6.4 5L12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z" />
            </svg>
          </button>
        )}
      </div>

      {isPlaying ? (
        /* PLAYER MODE — click anywhere in the box (except the scrubber) to
            pause and return to the TOC. The big pause button is still here
            as an obvious affordance, but the whole surface is a hit target. */
        <div
          className="px-4 py-6 flex flex-col items-center gap-5 cursor-pointer"
          onClick={togglePlayPause}
        >
          {/* Current section title */}
          <div className="text-center min-h-[2.5rem] flex items-center">
            <span className="font-serif text-base leading-snug text-ink">
              {currentSection.title}
            </span>
          </div>

          {/* Transport row — prev section, back 5s, pause (big), forward 5s,
              next section. justify-between spreads them across the full row
              for breathing room. All stop propagation so they don't fire the
              wrapper's click-to-close. */}
          <div className="flex w-full items-center justify-between px-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              disabled={currentIdx === 0}
              aria-label={s.prev}
              className="w-10 h-10 rounded-full flex items-center justify-center text-ink/70 hover:bg-accent/10 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M6 5h2v14H6V5zm3.5 7L20 5.14v13.72L9.5 12z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                seekBy(-5);
              }}
              aria-label={s.back5}
              className="w-10 h-10 rounded-full flex items-center justify-center text-ink/70 hover:bg-accent/10 hover:text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z" />
                <text x="12" y="17" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor">5</text>
              </svg>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              aria-label={s.pause}
              className="w-20 h-20 rounded-full flex items-center justify-center bg-accent text-white hover:bg-accent-strong transition-colors shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-9 h-9 fill-current">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                seekBy(5);
              }}
              aria-label={s.forward5}
              className="w-10 h-10 rounded-full flex items-center justify-center text-ink/70 hover:bg-accent/10 hover:text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M12 5V2l5 4-5 4V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z" />
                <text x="12" y="17" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor">5</text>
              </svg>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              disabled={currentIdx >= sections.length - 1}
              aria-label={s.next}
              className="w-10 h-10 rounded-full flex items-center justify-center text-ink/70 hover:bg-accent/10 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M4 5.14v13.72L14.5 12 4 5.14zM16 5h2v14h-2V5z" />
              </svg>
            </button>
          </div>

          {/* Scrubber + timer — stop click propagation so dragging the thumb
              or tapping the track doesn't bubble up and pause the audio. */}
          <div
            className="w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="range"
              min={0}
              max={effectiveDuration}
              step={0.5}
              value={currentTime}
              onChange={handleScrub}
              aria-label={s.seek}
              disabled={!isLoaded}
              className="w-full h-1.5 accent-accent cursor-pointer disabled:opacity-40"
            />
            <div className="flex justify-between mt-2 font-sans text-xs tabular-nums text-ink/60">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(effectiveDuration)}</span>
            </div>
          </div>

          {/* Pace control — its own row so it isn't crammed into the header.
              stopPropagation so tapping it doesn't pause via the wrapper. */}
          {paceControl && (
            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
              {paceControl}
            </div>
          )}
        </div>
      ) : (
        /* TOC MODE — section list. Tap any row to play that section. */
        <>
          <ul
            role="list"
            className="divide-y divide-divider max-h-[50vh] overflow-y-auto"
          >
            {sections.map((sec, idx) => {
              const isActive = idx === currentIdx;
              return (
                <li key={sec.id} ref={isActive ? activeLiRef : undefined}>
                  <button
                    type="button"
                    onClick={() => handleSectionClick(idx)}
                    aria-pressed={isActive}
                    aria-label={s.playSectionLabel.replace("{title}", sec.title)}
                    className={[
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                      "hover:bg-accent/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px]",
                      isActive ? "bg-accent/8 text-ink" : "text-ink/80",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex-shrink-0 w-4 text-center text-sm",
                        isActive ? "text-accent" : "text-ink/30",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      ▷
                    </span>
                    <span
                      className={[
                        "flex-1 font-sans text-sm",
                        isActive ? "font-semibold" : "font-normal",
                      ].join(" ")}
                    >
                      {sec.title}
                    </span>
                    <span className="flex-shrink-0 font-sans text-xs tabular-nums text-ink/40">
                      {formatTime(secDuration(sec))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="px-4 py-2 border-t border-divider flex items-center justify-between gap-2">
            {paceControl}
            <span className="ml-auto font-sans text-xs text-ink/35">
              {s.sectionsTotalLine
                .replace("{n}", String(sections.length))
                .replace("{time}", formatTime(totalDuration))}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
