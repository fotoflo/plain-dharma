import type { AudioManifest } from "@plain-dharma/content/audio";
import type { Locale, SuttaSlug } from "@plain-dharma/content";

import { bundledManifest } from "./bundled-manifests";

// Mobile streams audio from the deployed site (no bundled mp3s). NOTE: the
// fast-variant renditions and updated manifests must be deployed to production
// before fast-mode works on mobile — until then `durationFastSec` is absent and
// the player hides its speed control (graceful).
export const AUDIO_ORIGIN = "https://plaindharma.com";

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
  const base = `${AUDIO_ORIGIN}/audio/${locale}/${slug}`;
  return manifest.sections.map((s) => ({
    id: s.id,
    title: s.title,
    slowUrl: `${base}/${s.file}`,
    fastUrl: s.duration_fast_sec != null ? `${base}/fast/${s.file}` : undefined,
    durationSec: s.duration_sec,
    durationFastSec: s.duration_fast_sec,
  }));
}

/**
 * A sutta's streaming sections. Uses the OTA-bundled manifest when present (no
 * network round-trip — the Listen panel renders instantly), falling back to
 * fetching the manifest off the deployed site for anything not bundled.
 */
export async function fetchSuttaSections(
  locale: Locale,
  slug: SuttaSlug
): Promise<PlayerSection[]> {
  const bundled = bundledManifest(locale, slug);
  if (bundled) return manifestToSections(bundled, locale, slug);

  const base = `${AUDIO_ORIGIN}/audio/${locale}/${slug}`;
  const res = await fetch(`${base}/manifest.json`);
  if (!res.ok) throw new Error(`audio manifest ${slug}: HTTP ${res.status}`);
  const manifest = (await res.json()) as AudioManifest;
  return manifestToSections(manifest, locale, slug);
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
