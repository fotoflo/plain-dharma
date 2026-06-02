// Platform-agnostic audio types + helpers shared by web and mobile.
//
// No fs/network here. Web reads per-sutta manifests from disk at build time
// (apps' src/content/audio.ts keeps those fs readers); mobile fetches the same
// manifests over HTTP. The mp3s themselves live in the public Supabase bucket,
// so file URLs resolve through assetUrl (see ./assets). Both platforms share
// these types, the URL helper, and the pure combine logic for the /read playlist.

import { SUTTAS, type Locale, type SuttaSlug } from "./index";
import { getStrings } from "./strings";
import { assetUrl } from "./assets";

export type AudioSection = {
  id: string;
  title: string;
  file: string;
  duration_sec: number;
  // Optional alternate-speed ("faster", -7.5%) rendition. Present only when a
  // `fast/<file>` exists for this section; absent for locales/suttas without a
  // fast variant (e.g. zh), so a player hides its speed control.
  fileFast?: string;
  duration_fast_sec?: number;
};

export type AudioManifest = {
  slug: string;
  locale: string;
  voice: string;
  model: string;
  generated_at: string;
  sections: AudioSection[];
};

/**
 * Absolute CDN URL for a per-sutta audio file. `file` is a bucket-relative
 * filename ("01-opening.mp3") or `fast/<file>`; the result is the cache-busted
 * Supabase public URL. Returns the input unchanged if it's already absolute
 * (callers that pass an already-resolved manifest URL stay idempotent).
 */
export function getAudioFileUrl(
  locale: string,
  slug: string,
  file: string
): string {
  if (file.startsWith("http")) return file;
  return assetUrl(`audio/${locale}/${slug}/${file}`);
}

/**
 * Localize a section's display title. The framing tracks (`preface`, `opening`,
 * `drop`) are baked into manifests in English at generation time; everything
 * else (the sutta name on the `title` track, the heading-derived sections) is
 * already in the locale's language, so it passes through unchanged. Section ids
 * may be slug-prefixed (`loving-kindness--opening`) in the combined playlist —
 * we match the bare id.
 */
export function localizeSectionTitle(
  locale: string,
  id: string,
  fallbackTitle: string
): string {
  const a = getStrings(locale as Locale).audio;
  const bare = id.includes("--") ? id.slice(id.indexOf("--") + 2) : id;
  switch (bare) {
    case "preface":
      return a.trackPreface;
    case "opening":
      return a.trackOpening;
    case "drop":
      return a.trackDrop;
    default:
      return fallbackTitle;
  }
}

export type ManifestEntry = { slug: SuttaSlug; manifest: AudioManifest };

/**
 * Stitch per-sutta manifests into a single `/read` playlist. Section ids are
 * prefixed with the slug to avoid collisions ("opening" etc. exist in every
 * sutta); each `file` is resolved to an absolute CDN URL via getAudioFileUrl so
 * a player can resolve files across per-sutta dirs without per-section base
 * URLs. getAudioFileUrl is idempotent on already-absolute URLs, so this works
 * whether the caller's manifest carries bare filenames or resolved URLs.
 * Returns null when there are no manifests. Pure — callers supply the manifests
 * (web from disk, mobile from fetch).
 */
export function combineManifests(
  locale: string,
  entries: ManifestEntry[]
): AudioManifest | null {
  if (entries.length === 0) return null;

  const sections: AudioSection[] = [];
  for (const { slug, manifest } of entries) {
    for (const s of manifest.sections) {
      sections.push({
        id: `${slug}--${s.id}`,
        title: s.title,
        file: getAudioFileUrl(locale, slug, s.file),
        duration_sec: s.duration_sec,
        ...(s.fileFast
          ? {
              fileFast: getAudioFileUrl(locale, slug, s.fileFast),
              duration_fast_sec: s.duration_fast_sec,
            }
          : {}),
      });
    }
  }

  const first = entries[0].manifest;
  return {
    slug: "all",
    locale,
    voice: first.voice,
    model: first.model,
    generated_at: new Date().toISOString(),
    sections,
  };
}

/** Canonical sutta order, re-exported for audio consumers. */
export { SUTTAS };
export type { SuttaSlug };
