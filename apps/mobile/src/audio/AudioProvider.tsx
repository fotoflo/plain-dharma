import { getMeta, SUTTAS, type Locale, type SuttaSlug } from "@plain-dharma/content";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import TrackPlayer, {
  Event,
  useActiveTrack,
  useIsPlaying,
  useProgress,
  useTrackPlayerEvents,
} from "react-native-track-player";

import { resolveSuttaSections } from "./downloads";
import {
  hasFastVariant,
  sectionDuration,
  sectionUrl,
  type PlayerSection,
  type Speed,
} from "./manifest";
import { setupAudioPlayer } from "./setup";

type AudioContextValue = {
  /** Dedup key of the loaded queue ("en/first-talk" or "all/en"), or null. */
  loadedKey: string | null;
  sections: PlayerSection[];
  index: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  speed: Speed;
  hasFast: boolean;
  isLoaded: boolean;
  loading: boolean;
  error: string | null;
  /** Lazily fetch + queue a sutta's audio (no-op if already loaded). */
  load: (locale: Locale, slug: SuttaSlug) => Promise<void>;
  /** Lazily fetch + queue the combined all-talks /read playlist. */
  loadCombined: (locale: Locale) => Promise<void>;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  jumpTo: (index: number) => void;
  seekTo: (sec: number) => void;
  seekBy: (delta: number) => void;
  setSpeed: (s: Speed) => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

function toTracks(
  sections: PlayerSection[],
  speed: Speed,
  album: string
) {
  return sections.map((s) => ({
    id: s.id,
    url: sectionUrl(s, speed),
    title: s.title,
    artist: "Plain Dharma",
    album,
    duration: sectionDuration(s, speed),
  }));
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [sections, setSections] = useState<PlayerSection[]>([]);
  const [speed, setSpeedState] = useState<Speed>("slow");
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs mirror state for use inside async/stable callbacks (avoid stale closures).
  const loadedKeyRef = useRef<string | null>(null);
  const sectionsRef = useRef<PlayerSection[]>([]);
  const speedRef = useRef<Speed>("slow");
  const localeRef = useRef<Locale>("en");
  const albumRef = useRef<string>("");

  const { playing } = useIsPlaying();
  const isPlaying = playing ?? false;
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  const { position, duration } = useProgress(250);
  const activeTrack = useActiveTrack();

  // Active track index drives the highlighted section + page sync.
  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], (e) => {
    if (e.index != null) setIndex(e.index);
  });

  // Install a set of sections as the active queue.
  const installQueue = useCallback(
    async (secs: PlayerSection[], album: string) => {
      albumRef.current = album;
      await setupAudioPlayer();
      await TrackPlayer.reset();
      await TrackPlayer.add(toTracks(secs, speedRef.current, album));
      sectionsRef.current = secs;
      setSections(secs);
      setIndex(0);
    },
    []
  );

  // Shared loader for a dedup key (no-op if that key is already loaded).
  const loadKey = useCallback(
    async (
      locale: Locale,
      key: string,
      build: () => Promise<{ secs: PlayerSection[]; album: string }>
    ) => {
      if (loadedKeyRef.current === key) return;
      loadedKeyRef.current = key;
      localeRef.current = locale;
      setLoadedKey(key);
      setLoading(true);
      setError(null);
      try {
        const { secs, album } = await build();
        await installQueue(secs, album);
      } catch (err) {
        loadedKeyRef.current = null;
        setLoadedKey(null);
        setError(err instanceof Error ? err.message : "Failed to load audio");
      } finally {
        setLoading(false);
      }
    },
    [installQueue]
  );

  const load = useCallback(
    (locale: Locale, slug: SuttaSlug) =>
      loadKey(locale, `${locale}/${slug}`, async () => ({
        secs: await resolveSuttaSections(locale, slug),
        album: getMeta(locale, slug).title,
      })),
    [loadKey]
  );

  // Combined /read playlist: stitch every talk's sections (offline-aware via
  // resolveSuttaSections), prefixing ids with the slug to keep them unique.
  const loadCombined = useCallback(
    (locale: Locale) =>
      loadKey(locale, `all/${locale}`, async () => {
        const all: PlayerSection[] = [];
        for (const slug of SUTTAS) {
          const secs = await resolveSuttaSections(locale, slug);
          for (const s of secs) all.push({ ...s, id: `${slug}--${s.id}` });
        }
        return { secs: all, album: "The Buddha's foundational teachings" };
      }),
    [loadKey]
  );

  const play = useCallback(() => {
    void TrackPlayer.play();
  }, []);
  const pause = useCallback(() => {
    void TrackPlayer.pause();
  }, []);
  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) void TrackPlayer.pause();
    else void TrackPlayer.play();
  }, []);
  const next = useCallback(() => {
    void TrackPlayer.skipToNext();
  }, []);
  const prev = useCallback(() => {
    void TrackPlayer.skipToPrevious();
  }, []);
  const jumpTo = useCallback((i: number) => {
    void TrackPlayer.skip(i).then(() => TrackPlayer.play());
  }, []);
  const seekTo = useCallback((sec: number) => {
    void TrackPlayer.seekTo(sec);
  }, []);
  const seekBy = useCallback((delta: number) => {
    void TrackPlayer.seekBy(delta);
  }, []);

  // Pace switch: rebuild the queue at the new speed, preserving the current
  // section and fractional position (fast files are shorter), then resume if
  // it was playing. Mirrors the web player's changeSpeed.
  const setSpeed = useCallback(async (next: Speed) => {
    if (next === speedRef.current) return;
    const prev = speedRef.current;
    const secs = sectionsRef.current;
    if (secs.length === 0) {
      speedRef.current = next;
      setSpeedState(next);
      return;
    }
    const idx = (await TrackPlayer.getActiveTrackIndex()) ?? 0;
    const { position: pos } = await TrackPlayer.getProgress();
    const wasPlaying = isPlayingRef.current;
    const cur = secs[idx];
    const oldDur = sectionDuration(cur, prev);
    const frac = oldDur > 0 ? pos / oldDur : 0;
    const newPos = frac * sectionDuration(cur, next);

    speedRef.current = next;
    setSpeedState(next);
    await TrackPlayer.reset();
    await TrackPlayer.add(toTracks(secs, next, albumRef.current));
    await TrackPlayer.skip(idx, newPos);
    if (wasPlaying) await TrackPlayer.play();
  }, []);

  const setSpeedSafe = useCallback(
    (s: Speed) => {
      void setSpeed(s);
    },
    [setSpeed]
  );

  const value = useMemo<AudioContextValue>(
    () => ({
      loadedKey,
      sections,
      index,
      isPlaying,
      position,
      duration,
      speed,
      hasFast: hasFastVariant(sections),
      isLoaded: duration > 0,
      loading,
      error,
      load,
      loadCombined,
      play,
      pause,
      togglePlay,
      next,
      prev,
      jumpTo,
      seekTo,
      seekBy,
      setSpeed: setSpeedSafe,
    }),
    [
      loadedKey,
      sections,
      index,
      isPlaying,
      position,
      duration,
      speed,
      loading,
      error,
      load,
      loadCombined,
      play,
      pause,
      togglePlay,
      next,
      prev,
      jumpTo,
      seekTo,
      seekBy,
      setSpeedSafe,
    ]
  );

  // activeTrack is observed so RNTP keeps the subscription warm; index/title
  // come from the queue, so we don't read its fields directly here.
  void activeTrack;

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within an AudioProvider");
  return ctx;
}
