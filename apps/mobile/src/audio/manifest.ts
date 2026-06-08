import { localizeSectionTitle, type AudioManifest } from "@plain-dharma/content/audio";
import { assetUrl } from "@plain-dharma/content/assets";
import type { Locale, SuttaSlug } from "@plain-dharma/content";

import { bundledManifest } from "./bundled-manifests";

// Mobile streams audio (and fetches the per-sutta manifest) from the public
// Supabase CDN via assetUrl — the same source the web uses. NOTE: the
// fast-variant renditions and updated manifests must be uploaded before
// fast-mode works on mobile — until then `durationFastSec` is absent and the
// player hides its speed control (graceful).

export type PlayerSection = {
  id: string;
  title: string;
  /** Default -20% meditative rendition. */
  slowUrl: string;
  /** Optional -7.5% rendition (`fast/<file>`); present only when the manifest lists a fast duration. */
  fastUrl?: string;
  durationSec: number;
  durationFastSec?: number;
};

/**
 * Resolve a manifest's sections to absolute streaming slow/fast URLs. The static
 * manifest carries `duration_fast_sec` but not the fast file path (that's
 * server-injected on web), so the fast URL is derived by the `fast/<file>`
 * convention.
 */
export function manifestToSections(
  manifest: AudioManifest,
  locale: Locale,
  slug: SuttaSlug
): PlayerSection[] {
  const dir = `audio/${locale}/${slug}`;
  return manifest.sections.map((s) => ({
    id: s.id,
    title: localizeSectionTitle(locale, s.id, s.title),
    slowUrl: assetUrl(`${dir}/${s.file}`),
    fastUrl:
      s.duration_fast_sec != null
        ? assetUrl(`${dir}/fast/${s.file}`)
        : undefined,
    durationSec: s.duration_sec,
    durationFastSec: s.duration_fast_sec,
  }));
}

/**
 * A sutta's sections from the OTA-bundled manifest, or null if none was bundled
 * for it. Synchronous + no network — the Listen panel renders instantly. The
 * bundled copy goes stale on any content change (it's frozen at app build time),
 * so callers pair it with a CDN revalidation (see resolveSuttaSections).
 */
export function bundledSuttaSections(
  locale: Locale,
  slug: SuttaSlug
): PlayerSection[] | null {
  const bundled = bundledManifest(locale, slug);
  return bundled ? manifestToSections(bundled, locale, slug) : null;
}

/**
 * A sutta's raw manifest fetched fresh from the deployed CDN — the source of
 * truth for chapter labels/durations. Cache-busted with a timestamp so a stale
 * app-bundled asset-version hash can't pin the CDN edge to an old manifest.
 */
export async function fetchManifestFromCdn(
  locale: Locale,
  slug: SuttaSlug
): Promise<AudioManifest> {
  const base = assetUrl(`audio/${locale}/${slug}/manifest.json`);
  const url = `${base}${base.includes("?") ? "&" : "?"}t=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`audio manifest ${slug}: HTTP ${res.status}`);
  return (await res.json()) as AudioManifest;
}

/** Streaming sections from the fresh CDN manifest. */
export async function fetchSuttaSectionsFromCdn(
  locale: Locale,
  slug: SuttaSlug
): Promise<PlayerSection[]> {
  return manifestToSections(await fetchManifestFromCdn(locale, slug), locale, slug);
}

export type Speed = "slow" | "fast";

/** Whether any section has a fast variant (controls visibility of the speed toggle). */
export function hasFastVariant(sections: PlayerSection[]): boolean {
  return sections.some((s) => s.fastUrl != null);
}

/** Resolve a section's URL for the active pace. */
export function sectionUrl(section: PlayerSection, speed: Speed): string {
  return speed === "fast" && section.fastUrl ? section.fastUrl : section.slowUrl;
}

/** A section's listed duration for the active pace. */
export function sectionDuration(section: PlayerSection, speed: Speed): number {
  return speed === "fast" && section.durationFastSec != null
    ? section.durationFastSec
    : section.durationSec;
}
