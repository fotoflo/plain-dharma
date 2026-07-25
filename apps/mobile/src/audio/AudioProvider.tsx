import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMeta, SUTTAS, type Locale, type SuttaSlug } from "@plain-dharma/content";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Image } from "react-native";
import TrackPlayer, {
  Event,
  RepeatMode,
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
  /** Queue repeats forever instead of stopping at the last section. */
  loop: boolean;
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
  toggleLoop: () => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

// Loop preference is sticky across launches — someone who falls asleep to this
// wants it still looping tomorrow night. Same key the web player uses.
const LOOP_KEY = "pd-audio-loop";

// Bundled lock-screen / Now Playing artwork. A local require() (not a remote
// URL) so the icon renders offline too — downloaded audio plays without a
// network round-trip, and a URL artwork would silently show nothing there.
// Resolved to a URI string (what RNTP does internally) to satisfy its
// `artwork?: string` type cleanly in both dev and production bundles.
const ARTWORK = Image.resolveAssetSource(
  require("../../assets/images/icon.png")
).uri;

// Metadata-only equality: SWR revalidation can only change titles/durations
// (URLs are derived deterministically from the slug), so a deep compare of the
// display-relevant fields tells us whether an update is worth applying.
function sectionsEqual(a: PlayerSection[], b: PlayerSection[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].id !== b[i].id ||
      a[i].title !== b[i].title ||
      a[i].durationSec !== b[i].durationSec ||
      a[i].durationFastSec !== b[i].durationFastSec ||
      a[i].fastUrl !== b[i].fastUrl
    ) {
      return false;
    }
  }
  return true;
}

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
    artwork: ARTWORK,
    duration: sectionDuration(s, speed),
  }));
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [sections, setSections] = useState<PlayerSection[]>([]);
  const [speed, setSpeedState] = useState<Speed>("slow");
  const [index, setIndex] = useState(0);
  const [loop, setLoop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs mirror state for use inside async/stable callbacks (avoid stale closures).
  const loadedKeyRef = useRef<string | null>(null);
  const sectionsRef = useRef<PlayerSection[]>([]);
  const speedRef = useRef<Speed>("slow");
  const loopRef = useRef(false);
  const localeRef = useRef<Locale>("en");
  const albumRef = useRef<string>("");

  const { playing } = useIsPlaying();
  const isPlaying = playing ?? false;
  const isPlayingRef = useRef(false);

  const { position, duration } = useProgress(250);
  const activeTrack = useActiveTrack();

  // Mirror isPlaying state in a ref for use in stable callbacks.
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

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
      // reset() drops the repeat mode along with the queue, so re-apply the
      // user's loop preference to every queue we install.
      await TrackPlayer.setRepeatMode(
        loopRef.current ? RepeatMode.Queue : RepeatMode.Off
      );
      sectionsRef.current = secs;
      setSections(secs);
      setIndex(0);
    },
    []
  );

  // Shared loader. Always re-resolves (cheap: a local read or one fetch) so a
  // queue that was built from streaming URLs gets rebuilt with local file://
  // URLs once the audio is downloaded — and vice versa. Skips the rebuild only
  // when the same key resolves to the same source, so it never interrupts
  // ongoing playback needlessly.
  const loadKey = useCallback(
    async (
      locale: Locale,
      key: string,
      build: () => Promise<{ secs: PlayerSection[]; album: string }>
    ) => {
      setError(null);
      let resolved: { secs: PlayerSection[]; album: string };
      try {
        resolved = await build();
      } catch (err) {
        if (loadedKeyRef.current !== key) {
          setError(err instanceof Error ? err.message : "Failed to load audio");
        }
        return;
      }
      const nextUrl = resolved.secs[0]
        ? sectionUrl(resolved.secs[0], speedRef.current)
        : "";
      const curUrl = sectionsRef.current[0]
        ? sectionUrl(sectionsRef.current[0], speedRef.current)
        : "";
      if (loadedKeyRef.current === key && nextUrl === curUrl && nextUrl !== "") {
        return; // already loaded from the same source — keep playing
      }
      loadedKeyRef.current = key;
      localeRef.current = locale;
      setLoadedKey(key);
      setLoading(true);
      try {
        await installQueue(resolved.secs, resolved.album);
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

  // SWR applier: swap freshly-revalidated sections into the visible TOC and the
  // lock-screen/queue titles in place — no TrackPlayer.reset(), so playback is
  // never interrupted. Bails if the user has since loaded something else, if
  // nothing changed, or if the section count shifted (a structural change that
  // an in-place metadata update can't represent — left for the next full load).
  const applyRevalidated = useCallback(
    async (key: string, fresh: PlayerSection[]) => {
      if (loadedKeyRef.current !== key) return;
      const cur = sectionsRef.current;
      if (fresh.length !== cur.length || sectionsEqual(cur, fresh)) return;
      sectionsRef.current = fresh;
      setSections(fresh);
      await Promise.all(
        fresh.map((s, i) =>
          TrackPlayer.updateMetadataForTrack(i, { title: s.title }).catch(() => {})
        )
      );
    },
    []
  );

  const load = useCallback(
    (locale: Locale, slug: SuttaSlug) => {
      const key = `${locale}/${slug}`;
      return loadKey(locale, key, async () => ({
        secs: await resolveSuttaSections(locale, slug, (fresh) => {
          void applyRevalidated(key, fresh);
        }),
        album: getMeta(locale, slug).title,
      }));
    },
    [loadKey, applyRevalidated]
  );

  // Combined /read playlist: stitch every talk's sections (offline-aware via
  // resolveSuttaSections), prefixing ids with the slug to keep them unique. Each
  // talk revalidates independently; a fresh result rebuilds the whole combined
  // list from the latest known sections per slug and applies it in place.
  const loadCombined = useCallback(
    (locale: Locale) => {
      const key = `all/${locale}`;
      return loadKey(locale, key, async () => {
        const bySlug = new Map<SuttaSlug, PlayerSection[]>();
        const prefix = (slug: SuttaSlug, secs: PlayerSection[]) =>
          secs.map((s) => ({ ...s, id: `${slug}--${s.id}` }));
        const rebuild = () =>
          SUTTAS.flatMap((slug) => {
            const secs = bySlug.get(slug);
            return secs ? prefix(slug, secs) : [];
          });
        const all: PlayerSection[] = [];
        for (const slug of SUTTAS) {
          const secs = await resolveSuttaSections(locale, slug, (fresh) => {
            bySlug.set(slug, fresh);
            void applyRevalidated(key, rebuild());
          });
          bySlug.set(slug, secs);
          all.push(...prefix(slug, secs));
        }
        return { secs: all, album: "The Buddha's foundational teachings" };
      });
    },
    [loadKey, applyRevalidated]
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
    await TrackPlayer.setRepeatMode(
      loopRef.current ? RepeatMode.Queue : RepeatMode.Off
    );
    await TrackPlayer.skip(idx, newPos);
    if (wasPlaying) await TrackPlayer.play();
  }, []);

  const setSpeedSafe = useCallback(
    (s: Speed) => {
      void setSpeed(s);
    },
    [setSpeed]
  );

  // Restore the saved loop preference on launch. Only touches the player if a
  // queue is already installed; otherwise installQueue applies it (loopRef is
  // set synchronously here, so a load racing this still gets the right mode).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const saved = await AsyncStorage.getItem(LOOP_KEY).catch(() => null);
      if (cancelled || saved !== "1") return;
      loopRef.current = true;
      setLoop(true);
      if (sectionsRef.current.length > 0) {
        await TrackPlayer.setRepeatMode(RepeatMode.Queue).catch(() => {});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleLoop = useCallback(() => {
    const next = !loopRef.current;
    loopRef.current = next;
    setLoop(next);
    AsyncStorage.setItem(LOOP_KEY, next ? "1" : "0").catch(() => {});
    // No queue yet → nothing to configure; installQueue picks up loopRef.
    if (sectionsRef.current.length === 0) return;
    void TrackPlayer.setRepeatMode(
      next ? RepeatMode.Queue : RepeatMode.Off
    ).catch(() => {});
  }, []);

  const value = useMemo<AudioContextValue>(
    () => ({
      loadedKey,
      sections,
      index,
      isPlaying,
      position,
      duration,
      speed,
      loop,
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
      toggleLoop,
    }),
    [
      loadedKey,
      sections,
      index,
      isPlaying,
      position,
      duration,
      speed,
      loop,
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
      toggleLoop,
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
