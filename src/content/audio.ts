import { promises as fs } from "node:fs";
import path from "node:path";

import type { SuttaSlug } from "./index";

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
