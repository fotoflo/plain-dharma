// Platform-agnostic audio types + helpers shared by web and mobile.
//
// No fs/network here. Web reads per-sutta manifests from disk at build time
// (apps' src/content/audio.ts keeps those fs readers); mobile fetches the same
// manifests over HTTP from plaindharma.com. Both share these types, the URL
// helper, and the pure combine logic for the /read playlist.

import { SUTTAS, type SuttaSlug } from "./index";

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

/** Site-relative path to a per-sutta audio file. */
export function getAudioFileUrl(
  locale: string,
  slug: string,
  file: string
): string {
  return `/audio/${locale}/${slug}/${file}`;
}

export type ManifestEntry = { slug: SuttaSlug; manifest: AudioManifest };

/**
 * Stitch per-sutta manifests into a single `/read` playlist. Section ids are
 * prefixed with the slug to avoid collisions ("opening" etc. exist in every
 * sutta); each `file` becomes an absolute `/audio/...` path so a player can
 * resolve files across per-sutta dirs without per-section base URLs. Returns
 * null when there are no manifests. Pure — callers supply the manifests
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
        file: `/audio/${locale}/${slug}/${s.file}`,
        duration_sec: s.duration_sec,
        ...(s.fileFast
          ? {
              fileFast: `/audio/${locale}/${slug}/${s.fileFast}`,
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
