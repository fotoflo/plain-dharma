import { SUTTAS, type Locale, type SuttaSlug } from "@plain-dharma/content";
import { localizeSectionTitle, type AudioManifest } from "@plain-dharma/content/audio";
import { assetUrl } from "@plain-dharma/content/assets";
import { Directory, File, Paths } from "expo-file-system";

import {
  bundledSuttaSections,
  fetchManifestFromCdn,
  fetchSuttaSectionsFromCdn,
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
    const dir = `audio/${locale}/${slug}`;
    const res = await fetch(assetUrl(`${dir}/manifest.json`));
    if (!res.ok) throw new Error(`manifest ${slug}: HTTP ${res.status}`);
    const m = (await res.json()) as AudioManifest;
    manifests[slug] = m;
    for (const s of m.sections) {
      jobs.push({ slug, file: s.file, url: assetUrl(`${dir}/${s.file}`) });
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
 * Resolve a sutta's sections to local file:// URIs when downloaded, else stream
 * from the deployed site. Used by the audio queue builder.
 *
 * Both paths use stale-while-revalidate so freshly-published chapter labels
 * appear without an app rebuild or re-download:
 *  - Online-not-downloaded: the bundled manifest renders instantly, then the CDN
 *    copy is fetched and handed to `onRevalidated`.
 *  - Downloaded: local file:// audio is authoritative for *playback*, but its
 *    *metadata* (titles/durations) can be stale if the manifest was relabeled
 *    after download. Revalidate the labels from the CDN, remap them onto the
 *    local files (audio is unchanged), persist the refreshed manifest, and emit.
 */
export async function resolveSuttaSections(
  locale: Locale,
  slug: SuttaSlug,
  onRevalidated?: (fresh: PlayerSection[]) => void
): Promise<PlayerSection[]> {
  const local = await readLocalManifest(locale, slug);
  if (local) {
    const toLocalSections = (m: AudioManifest): PlayerSection[] =>
      m.sections.map((s) => ({
        id: s.id,
        title: localizeSectionTitle(locale, s.id, s.title),
        slowUrl: new File(suttaDir(locale, slug), s.file).uri,
        // Fast variants aren't downloaded in v1 — offline plays the slow pace.
        fastUrl: undefined,
        durationSec: s.duration_sec,
        durationFastSec: s.duration_fast_sec,
      }));

    if (onRevalidated) {
      void fetchManifestFromCdn(locale, slug)
        .then((fresh) => {
          // Only remap when the section shape matches the downloaded files
          // (label change). A structural change needs a re-download, not a
          // metadata patch — leave the local copy untouched in that case.
          const sameShape =
            fresh.sections.length === local.sections.length &&
            fresh.sections.every((s, i) => s.file === local.sections[i].file);
          if (!sameShape) return;
          manifestFile(locale, slug).write(JSON.stringify(fresh));
          onRevalidated(toLocalSections(fresh));
        })
        .catch(() => {}); // offline / flaky → keep the local labels
    }
    return toLocalSections(local);
  }

  const bundled = bundledSuttaSections(locale, slug);
  if (bundled) {
    if (onRevalidated) {
      // Background revalidate; offline/flaky network keeps the bundled copy.
      void fetchSuttaSectionsFromCdn(locale, slug)
        .then(onRevalidated)
        .catch(() => {});
    }
    return bundled;
  }
  return fetchSuttaSectionsFromCdn(locale, slug);
}
