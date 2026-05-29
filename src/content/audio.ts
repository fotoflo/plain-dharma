// Web shim over the shared @plain-dharma/content/audio module.
//
// The platform-agnostic audio types, the URL helper, and the pure
// `combineManifests` stitching live in the workspace package. This file adds
// the web-only pieces that read manifests off disk at build time (fs +
// mtime-based cache-busting) — mobile instead fetches the same manifests over
// HTTP, so those readers stay out of the shared package.
import { promises as fs, statSync } from "node:fs";
import path from "node:path";

import {
  SUTTAS,
  combineManifests,
  type AudioManifest,
  type ManifestEntry,
} from "@plain-dharma/content/audio";
import type { SuttaSlug } from "@plain-dharma/content";

export * from "@plain-dharma/content/audio";

// Append `?v=<mtime-seconds>` so a regenerated mp3 invalidates the browser
// cache automatically (same trick as illustrations.ts). Server-only.
function versionSuffix(absPath: string): string {
  try {
    const mtime = statSync(absPath).mtimeMs;
    return `?v=${Math.floor(mtime / 1000)}`;
  } catch {
    return "";
  }
}

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
    const dir = path.dirname(filePath);
    manifest.sections = manifest.sections.map((s) => {
      const fastRel = `fast/${s.file}`;
      const fastV = versionSuffix(path.join(dir, fastRel));
      return {
        ...s,
        file: s.file + versionSuffix(path.join(dir, s.file)),
        // Only expose the fast variant when the rendered file actually exists.
        ...(fastV ? { fileFast: fastRel + fastV } : {}),
      };
    });
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
