import { promises as fs, statSync } from "node:fs";
import path from "node:path";

import { SUTTAS, type SuttaSlug } from "./index";

type AvailableEntry = { slug: SuttaSlug; manifest: AudioManifest };

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

export type AudioSection = {
  id: string;
  title: string;
  file: string;
  duration_sec: number;
};

export type AudioManifest = {
  slug: string;
  locale: string;
  voice: string;
  model: string;
  generated_at: string;
  sections: AudioSection[];
};

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
    manifest.sections = manifest.sections.map((s) => ({
      ...s,
      file: s.file + versionSuffix(path.join(dir, s.file)),
    }));
    return manifest;
  } catch {
    return null;
  }
}

export function getAudioFileUrl(
  locale: string,
  slug: string,
  file: string
): string {
  return `/audio/${locale}/${slug}/${file}`;
}

/**
 * Stitch every available per-sutta manifest into a single playlist for `/read`.
 * Each section's `file` is an absolute `/audio/...` path so the player can
 * resolve files from different per-sutta dirs without per-section base URLs.
 * Section ids are prefixed with the slug to avoid collisions ("opening" etc.
 * exist in every sutta). Missing per-sutta manifests are skipped — the player
 * renders with whatever is recorded. Returns null only if no audio exists for
 * the locale at all.
 */
export async function getCombinedAudioManifest(
  locale: string
): Promise<AudioManifest | null> {
  const perSutta = await Promise.all(
    SUTTAS.map((slug) => getAudioManifest(locale, slug))
  );
  const available = perSutta
    .map((m, idx): AvailableEntry | null =>
      m ? { slug: SUTTAS[idx], manifest: m } : null
    )
    .filter((x): x is AvailableEntry => x !== null);
  if (available.length === 0) return null;

  const sections: AudioSection[] = [];
  for (const { slug, manifest } of available) {
    for (const s of manifest.sections) {
      sections.push({
        id: `${slug}--${s.id}`,
        title: s.title,
        file: `/audio/${locale}/${slug}/${s.file}`,
        duration_sec: s.duration_sec,
      });
    }
  }

  const first = available[0].manifest;
  return {
    slug: "all",
    locale,
    voice: first.voice,
    model: first.model,
    generated_at: new Date().toISOString(),
    sections,
  };
}
