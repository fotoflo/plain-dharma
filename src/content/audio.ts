import { promises as fs, statSync } from "node:fs";
import path from "node:path";

import { SUTTAS, type SuttaSlug } from "./index";

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
 * Stitch all six per-sutta manifests into a single playlist for `/read`.
 * Each section's `file` is an absolute `/audio/...` path so the player can
 * resolve files from different per-sutta dirs without per-section base URLs.
 * Section ids are prefixed with the slug to avoid collisions ("opening" etc.
 * exist in every sutta). Returns null if any per-sutta manifest is missing.
 */
export async function getCombinedAudioManifest(
  locale: string
): Promise<AudioManifest | null> {
  const perSutta = await Promise.all(
    SUTTAS.map((slug) => getAudioManifest(locale, slug))
  );
  if (perSutta.some((m) => m === null)) return null;

  const sections: AudioSection[] = [];
  perSutta.forEach((m, idx) => {
    const slug = SUTTAS[idx];
    for (const s of m!.sections) {
      sections.push({
        id: `${slug}--${s.id}`,
        title: s.title,
        file: `/audio/${locale}/${slug}/${s.file}`,
        duration_sec: s.duration_sec,
      });
    }
  });

  const first = perSutta[0]!;
  return {
    slug: "all",
    locale,
    voice: first.voice,
    model: first.model,
    generated_at: new Date().toISOString(),
    sections,
  };
}
