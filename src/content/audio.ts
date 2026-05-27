import { promises as fs } from "node:fs";
import path from "node:path";

import { SUTTAS_IN_ORDER, type SuttaSlug } from "./index";

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
    return JSON.parse(raw) as AudioManifest;
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
    SUTTAS_IN_ORDER.map((m) => getAudioManifest(locale, m.slug))
  );
  if (perSutta.some((m) => m === null)) return null;

  const sections: AudioSection[] = [];
  perSutta.forEach((m, idx) => {
    const slug = SUTTAS_IN_ORDER[idx].slug;
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
