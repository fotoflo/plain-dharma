// Web shim over the shared @plain-dharma/content/audio module.
//
// The platform-agnostic audio types, the URL helper, and the pure
// `combineManifests` stitching live in the workspace package. This file adds
// the web-only piece: reading the per-sutta manifest.json off disk at build
// time (the manifests stay in git — only the mp3s are offsite). Each section's
// file/fileFast is resolved to its absolute Supabase CDN URL via the shared
// getAudioFileUrl, which also applies content-hash cache-busting from the
// version map. Mobile fetches the same manifests over HTTP and resolves URLs
// the same way.
import { promises as fs } from "node:fs";
import path from "node:path";

import {
  SUTTAS,
  combineManifests,
  getAudioFileUrl,
  type AudioManifest,
  type ManifestEntry,
} from "@plain-dharma/content/audio";
import type { SuttaSlug } from "@plain-dharma/content";

export * from "@plain-dharma/content/audio";

export async function getAudioManifest(
  locale: string,
  slug: SuttaSlug
): Promise<AudioManifest | null> {
  const filePath = path.join(
    process.cwd(),
    "public",
    "audio",
    locale,
    slug,
    "manifest.json"
  );
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const manifest = JSON.parse(raw) as AudioManifest;
    manifest.sections = manifest.sections.map((s) => ({
      ...s,
      file: getAudioFileUrl(locale, slug, s.file),
      // The fast variant is keyed off the manifest (duration_fast_sec), not a
      // disk check — the rendered mp3s no longer live locally. Locales without
      // a fast rendition (e.g. zh) omit the field, so the player hides its
      // speed control.
      ...(s.duration_fast_sec != null
        ? { fileFast: getAudioFileUrl(locale, slug, `fast/${s.file}`) }
        : {}),
    }));
    return manifest;
  } catch {
    return null;
  }
}

/**
 * Read every per-sutta manifest off disk and stitch them into a single `/read`
 * playlist via the shared `combineManifests`. Missing per-sutta manifests are
 * skipped — the player renders with whatever is recorded. Returns null only if
 * no audio exists for the locale at all.
 */
export async function getCombinedAudioManifest(
  locale: string
): Promise<AudioManifest | null> {
  const perSutta = await Promise.all(
    SUTTAS.map((slug) => getAudioManifest(locale, slug))
  );
  const entries = perSutta
    .map((manifest, idx): ManifestEntry | null =>
      manifest ? { slug: SUTTAS[idx], manifest } : null
    )
    .filter((x): x is ManifestEntry => x !== null);
  return combineManifests(locale, entries);
}
