// Typed reader for the archive index — the superseded narration takes, pacing
// experiments, un-stretched TTS masters, and older book builds published under
// the `archive/` prefix of the public assets bucket.
//
// archive.json is generated and committed by scripts/publish-archive.ts. Like
// assets.ts this module is pure and platform-agnostic (no fs), so it's safe in
// client, edge, and React Native code.

import archive from "./archive.json";

/** What a group is: an experiment, a full read, raw TTS output, or a book build. */
export type ArchiveKind = "experiment" | "narration" | "masters" | "build";

/** Which cut of a section a track is. Absent on notes files and book builds. */
export type ArchiveVariant = "standard" | "fast" | "master";

export type ArchiveItem = {
  /** Human label, already prettified by the publisher. Fallback for items with
   *  no slug (pacing samples, book builds). */
  label: string;
  /** Bucket-relative path — pass to assetUrl/assetDownloadUrl. */
  path: string;
  bytes: number;
  /** Duration for audio, null for text/PDF items (or when ffprobe was absent). */
  seconds: number | null;
  /** Sutta or framing slug this track belongs to, when it is a narration track. */
  slug?: string;
  variant?: ArchiveVariant;
  /** Track number ("02") and title, split so archived tracks render exactly
   *  like the live ones in the Audio section. */
  num?: string;
  name?: string;
};

export type ArchiveGroup = {
  id: string;
  title: string;
  kind: ArchiveKind;
  /** YYYY-MM-DD the take was recorded / the build was made. */
  date: string;
  /** Narration locale, so sutta titles render in the right language. */
  locale?: "en" | "zh";
  /** "Name (voiceId)" for narration and masters; absent for builds. */
  voice?: string;
  note: string;
  /** Bucket path of a README documenting the group, if one exists. */
  readme?: string;
  items: ArchiveItem[];
};

type ArchiveIndex = { generated_at: string; groups: ArchiveGroup[] };

const INDEX = archive as ArchiveIndex;

export const ARCHIVE_GENERATED_AT = INDEX.generated_at;

/** Every archive group, in publication order. Empty until publish-archive runs. */
export function getArchiveGroups(): ArchiveGroup[] {
  return INDEX.groups ?? [];
}

/** Total file count and byte size across the archive. */
export function archiveTotals(): { files: number; bytes: number } {
  return getArchiveGroups().reduce(
    (acc, g) => ({
      files: acc.files + g.items.length,
      bytes: acc.bytes + g.items.reduce((n, i) => n + i.bytes, 0),
    }),
    { files: 0, bytes: 0 }
  );
}

/** "84.1" → "1:24". Null durations render as an empty string. */
export function formatDuration(seconds: number | null): string {
  if (seconds == null) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
