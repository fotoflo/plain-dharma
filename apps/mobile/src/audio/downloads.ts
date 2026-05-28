import { SUTTAS, type Locale, type SuttaSlug } from "@plain-dharma/content";
import type { AudioManifest } from "@plain-dharma/content/audio";
import { Directory, File, Paths } from "expo-file-system";

import {
  AUDIO_ORIGIN,
  fetchSuttaSections,
  type PlayerSection,
} from "./manifest";

// Offline storage layout (persistent — Paths.document survives low-storage):
//   <document>/audio/<locale>/<slug>/manifest.json
//   <document>/audio/<locale>/<slug>/<file>.mp3
// v1 downloads the SLOW renditions only (the default pace); fast variants stay
// streamed when online and are simply unavailable offline.

function suttaDir(locale: Locale, slug: SuttaSlug): Directory {
  return new Directory(Paths.document, "audio", locale, slug);
}
function localeRoot(locale: Locale): Directory {
  return new Directory(Paths.document, "audio", locale);
}
function manifestFile(locale: Locale, slug: SuttaSlug): File {
  return new File(suttaDir(locale, slug), "manifest.json");
}

export type DownloadProgress = { done: number; total: number };

async function readLocalManifest(
  locale: Locale,
  slug: SuttaSlug
): Promise<AudioManifest | null> {
  const f = manifestFile(locale, slug);
  if (!f.exists) return null;
  try {
    return JSON.parse(await f.text()) as AudioManifest;
  } catch {
    return null;
  }
}

/**
 * Downloaded when every sutta has a locally-stored manifest. Disk is the source
 * of truth — no separate persisted flag that can drift out of sync.
 */
export function isLocaleDownloaded(locale: Locale): boolean {
  return SUTTAS.every((slug) => manifestFile(locale, slug).exists);
}

/**
 * Download every section's slow mp3 for a whole locale, plus each sutta's
 * manifest (so the queue can be built offline). Idempotent: existing files are
 * skipped, so an interrupted download resumes. Only flags the locale complete
 * after all files succeed.
 */
export async function downloadLocale(
  locale: Locale,
  onProgress?: (p: DownloadProgress) => void
): Promise<void> {
  const manifests: Partial<Record<SuttaSlug, AudioManifest>> = {};
  const jobs: { slug: SuttaSlug; file: string; url: string }[] = [];

  for (const slug of SUTTAS) {
    const base = `${AUDIO_ORIGIN}/audio/${locale}/${slug}`;
    const res = await fetch(`${base}/manifest.json`);
    if (!res.ok) throw new Error(`manifest ${slug}: HTTP ${res.status}`);
    const m = (await res.json()) as AudioManifest;
    manifests[slug] = m;
    for (const s of m.sections) {
      jobs.push({ slug, file: s.file, url: `${base}/${s.file}` });
    }
  }

  const total = jobs.length;
  let done = 0;
  onProgress?.({ done, total });

  for (const slug of SUTTAS) {
    suttaDir(locale, slug).create({ intermediates: true, idempotent: true });
  }

  for (const job of jobs) {
    const dest = new File(suttaDir(locale, job.slug), job.file);
    if (!dest.exists) await File.downloadFileAsync(job.url, dest);
    done += 1;
    onProgress?.({ done, total });
  }

  for (const slug of SUTTAS) {
    const m = manifests[slug];
    if (m) manifestFile(locale, slug).write(JSON.stringify(m));
  }
}

/** Delete all offline audio for a locale. */
export function removeLocale(locale: Locale): void {
  const root = localeRoot(locale);
  if (root.exists) root.delete();
}

/**
 * Resolve a sutta's sections to local file:// URIs when downloaded, else fall
 * back to streaming from the deployed site. Used by the audio queue builder.
 */
export async function resolveSuttaSections(
  locale: Locale,
  slug: SuttaSlug
): Promise<PlayerSection[]> {
  const local = await readLocalManifest(locale, slug);
  if (local) {
    return local.sections.map((s) => ({
      id: s.id,
      title: s.title,
      slowUrl: new File(suttaDir(locale, slug), s.file).uri,
      // Fast variants aren't downloaded in v1 — offline plays the slow pace.
      fastUrl: undefined,
      durationSec: s.duration_sec,
      durationFastSec: s.duration_fast_sec,
    }));
  }
  return fetchSuttaSections(locale, slug);
}
