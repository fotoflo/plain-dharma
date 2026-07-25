/**
 * Publish the ARCHIVE — every superseded narration take, the pacing
 * experiments, the un-stretched TTS masters, and the older book builds — to the
 * public `assets` bucket under an `archive/` prefix, and write the curated
 * index the /assets page renders.
 *
 * Why: these recordings only ever existed on one laptop. The May 27 English
 * generation and the ZH masters live inside a git worktree
 * (.claude/worktrees/rn-mobile) that a single `git worktree remove` would
 * delete; the pacing experiments live in gitignored dist/. Publishing them
 * makes the provenance of the narration inspectable — which is the point of
 * /how-it-was-made — and gets them off a single disk.
 *
 * Non-destructive. It only ever ADDS `archive/` keys; it never touches
 * `audio/`, `downloads/`, or `illustrations/`, and it MERGES into
 * asset-version.json rather than rewriting it.
 *
 * Outputs:
 *   - bucket:  assets/archive/**
 *   - commit:  packages/content/archive.json      (the curated index)
 *   - commit:  packages/content/asset-version.json (merged: hashes + sizes)
 *
 * Requires in .env.local: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY
 * (or SUPABASE_SERVICE_ROLE_KEY). Run:
 *   pnpm publish-archive            # upload + write both files
 *   pnpm publish-archive --dry-run     # plan only, no network writes
 *   pnpm publish-archive --index-only  # rebuild archive.json, upload nothing
 */

import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WORKTREE = join(ROOT, ".claude/worktrees/rn-mobile/public/audio");
const DIST = join(ROOT, "dist");
const VERSION_MAP_PATH = join(ROOT, "packages/content/asset-version.json");
const ARCHIVE_INDEX_PATH = join(ROOT, "packages/content/archive.json");
const BUCKET = "assets";
const PREFIX = "archive";
const DRY = process.argv.includes("--dry-run");
// Rebuild archive.json from what's already published, without re-uploading a
// byte. The bucket objects and their hashes are unchanged; only the index's
// shape/labels are. Use after changing how the page groups tracks.
const INDEX_ONLY = process.argv.includes("--index-only");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "ERROR: need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY " +
      "(or SUPABASE_SERVICE_ROLE_KEY) in .env.local.\n" +
      "Get a secret key at:\n" +
      "  https://supabase.com/dashboard/project/ffoiltrarbdbibmymlqm/settings/api-keys"
  );
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

// ── shared helpers (same contract as upload-assets-to-supabase.ts) ───────────

function contentType(path: string): string {
  switch (extname(path).toLowerCase()) {
    case ".mp3": return "audio/mpeg";
    case ".m4b": return "audio/mp4";
    case ".json": return "application/json";
    case ".pdf": return "application/pdf";
    case ".epub": return "application/epub+zip";
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".mdx":
    case ".md": return "text/markdown; charset=utf-8";
    default: return "application/octet-stream";
  }
}

/** Supabase rejects non-ASCII object keys; substitute a stable hash per segment. */
function bucketKeyFor(relKey: string): string {
  return relKey
    .split("/")
    .map((seg) => {
      if (/^[A-Za-z0-9._-]+$/.test(seg)) return seg;
      const dot = seg.lastIndexOf(".");
      const ext = dot >= 0 && /^\.[A-Za-z0-9]+$/.test(seg.slice(dot)) ? seg.slice(dot) : "";
      return createHash("sha1").update(seg).digest("hex").slice(0, 16) + ext;
    })
    .join("/");
}

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && e.name !== ".DS_Store") yield full;
  }
}

/** Seconds of an audio file via ffprobe, or null when ffprobe isn't available. */
function duration(file: string): number | null {
  try {
    const out = execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
      { encoding: "utf8" }
    ).trim();
    const n = Number(out);
    return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
  } catch {
    return null;
  }
}

/** YYYY-MM-DD of a file's mtime — the take's recording date. */
function fileDate(file: string): string {
  return statSync(file).mtime.toISOString().slice(0, 10);
}

// ── the curated set ──────────────────────────────────────────────────────────

type Variant = "standard" | "fast" | "master";
type Item = {
  /** Fallback display name — used for items that aren't sutta tracks. */
  label: string;
  src: string;
  path: string;
  /** Sutta/framing slug, when the item is a narration track. */
  slug?: string;
  variant?: Variant;
  /** Track number ("02") and title ("The Same Fire Everywhere"), split so the
   *  page can render these exactly like the live Audio section. */
  num?: string;
  name?: string;
};
type Group = {
  id: string;
  title: string;
  kind: "experiment" | "narration" | "masters" | "build";
  date: string;
  /** Locale of the narration, so the page can title suttas in the right language. */
  locale?: "en" | "zh";
  voice?: string;
  note: string;
  items: Item[];
  /** Bucket path of a README/notes file that documents the group, if any. */
  readme?: string;
};

/**
 * "02-the-same-fire-everywhere.mp3" → { num: "02", name: "The Same Fire Everywhere" }
 * Mirrors trackLabel() in src/app/assets/page.tsx so archived tracks read
 * identically to the live ones. Chinese names pass through untouched.
 */
function splitTrack(file: string): { num: string; name: string } {
  const base = basename(file)
    .replace(/\.(mp3|mdx|md)$/, "")
    .replace(/^orig-/, "");
  const m = base.match(/^(\d+[a-z]?)-(.*)$/);
  if (!m) return { num: "", name: base.replace(/-/g, " ") };
  const name = m[2].replace(/-/g, " ").replace(/\b[a-z]/g, (c) => c.toUpperCase());
  return { num: m[1], name };
}

/** "02 · The Same Fire Everywhere" — flat label for non-sutta items. */
function prettyTrack(file: string): string {
  const { num, name } = splitTrack(file);
  return num ? `${num} · ${name}` : name;
}

/**
 * Every mp3 under `dir` (recursive), as items rooted at `destPrefix`, carrying
 * the slug + track split the page needs to group them by sutta.
 */
function tracksFrom(
  dir: string,
  destPrefix: string,
  keep: (f: string) => boolean,
  variant: Variant
): Item[] {
  if (!existsSync(dir)) return [];
  return [...walk(dir)]
    .filter((f) => /\.(mp3|md)$/.test(f) && keep(f))
    .sort()
    .map((src) => {
      const rel = relative(dir, src).split(/[\\/]/).join("/");
      // drop the `candidates/` segment — the destination path already says what these are
      const flat = rel.replace(/\/candidates\//, "/");
      const slug = dirname(flat) === "." ? undefined : dirname(flat);
      // A notes file rides along with the takes it documents; it is not a track.
      if (src.endsWith(".md")) {
        return { label: `${slug ? `${slug} — ` : ""}Notes`, src, path: `${destPrefix}/${flat}`, slug };
      }
      const { num, name } = splitTrack(flat);
      return {
        label: `${slug ? `${slug} — ` : ""}${prettyTrack(flat)}`,
        src,
        path: `${destPrefix}/${flat}`,
        slug,
        variant,
        num,
        name,
      };
    });
}

const notCandidate = (f: string) => !f.includes("/candidates/");
const isCandidate = (f: string) => f.includes("/candidates/");

function buildGroups(): Group[] {
  const groups: Group[] = [];

  // 1. the pacing experiments — 11 renderings of one section
  const paceDir = join(DIST, "pace-test");
  if (existsSync(paceDir)) {
    const items = [...walk(paceDir)]
      .filter((f) => /\.(mp3|mdx|md)$/.test(f))
      .sort()
      .map((src) => ({
        label: prettyTrack(src),
        src,
        path: `${PREFIX}/pace-test/${basename(src)}`,
      }));
    groups.push({
      id: "pace-test",
      title: "Pacing experiments",
      kind: "experiment",
      date: "2026-05-31",
      locale: "en",
      voice: "Theo Silk (UmQN7jS1Ee8B1czsUtQh)",
      note:
        "Eleven renderings of one section — First Talk · Knowing Each One Three Ways — " +
        "testing what actually slows eleven_multilingual_v2 down. Whitespace, <break> tags " +
        "and punctuation all did nothing; only time-stretch and real spliced silence worked. " +
        "Sample 11 is the technique that ships.",
      items,
      readme: `${PREFIX}/pace-test/README.md`,
    });
  }

  // 2. the superseded May 27 English narration (replaced by the June 7 regen)
  const enDir = join(WORKTREE, "en");
  const enTracks = tracksFrom(enDir, `${PREFIX}/2026-05-27-en`, notCandidate, "standard");
  if (enTracks.length) {
    groups.push({
      id: "en-2026-05-27",
      title: "English narration — May 27 generation",
      kind: "narration",
      date: "2026-05-27",
      locale: "en",
      voice: "Theo Silk (UmQN7jS1Ee8B1czsUtQh)",
      note:
        "The first full English read, superseded by the June 7 regeneration that added " +
        "spliced-silence pausing. Same voice, different pacing — every section runs a few " +
        "percent longer. Includes a First Talk title track that no longer exists anywhere else.",
      items: enTracks,
    });
  }

  // 3. the un-stretched English masters behind that generation
  const enMasters = tracksFrom(enDir, `${PREFIX}/2026-05-27-en-masters`, isCandidate, "master");
  if (enMasters.length) {
    groups.push({
      id: "en-masters-2026-05-27",
      title: "English masters — un-stretched",
      kind: "masters",
      date: "2026-05-27",
      locale: "en",
      voice: "Theo Silk (UmQN7jS1Ee8B1czsUtQh)",
      note:
        "Raw ElevenLabs output before any time-stretch, for the May 27 read. Re-pacing a " +
        "section to any speed starts here and costs no new TTS.",
      items: enMasters,
    });
  }

  // 4. the abandoned Mandarin voice
  const haoranDir = join(WORKTREE, "zh_tts");
  const haoran = tracksFrom(haoranDir, `${PREFIX}/2026-05-27-zh-haoran`, notCandidate, "standard");
  if (haoran.length) {
    groups.push({
      id: "zh-haoran",
      title: "Mandarin narration — Haoran (abandoned)",
      kind: "narration",
      date: "2026-05-27",
      locale: "zh",
      voice: "Haoran (pU9NaAwkoR3v0Mrg3uKz)",
      note:
        "A complete alternate Mandarin read in a Beijing-accented male voice, recorded the " +
        "same week and never shipped — the site went with CarterSutra instead. Published here " +
        "because it is the only copy.",
      items: haoran,
    });
  }

  // 5. the Mandarin masters (the only copy — never uploaded with the live zh audio)
  const zhMasters = tracksFrom(join(WORKTREE, "zh"), `${PREFIX}/zh-masters`, isCandidate, "master");
  if (zhMasters.length) {
    groups.push({
      id: "zh-masters",
      title: "Mandarin voice auditions & pre-slowdown originals",
      kind: "experiment",
      date: "2026-05-28",
      locale: "zh",
      voice: "CarterSutra (bU2VfAdiOb2Gv2eZWlFq) · Hardy (FS8UtxyDrvYcNCxVaziq)",
      note:
        "The only true multi-take material in the project. Every live Mandarin track is one " +
        "of these at 30% slower (ffmpeg atempo=0.7692), and alongside the normal-speed " +
        "originals sit real alternates: the title and preface in Hardy, a Taiwanese voice " +
        "that was live before CarterSutra replaced it, and the opening at 10%, 20% and 30% " +
        "slower so the pacing choice can be heard side by side. First Talk carries the " +
        "audition notes.",
      items: zhMasters,
      readme: `${PREFIX}/zh-masters/first-talk/README.md`,
    });
  }

  // 6. superseded book builds
  const builds: [string, string][] = [
    [join(DIST, "audiobook/plain-dharma.m4b"), "Audiobook (M4B)"],
    [join(DIST, "pdf/plain-dharma.pdf"), "Screen PDF"],
    [join(DIST, "ebook/plain-dharma.epub"), "EPUB"],
    [join(DIST, "print/plain-dharma-print-bw.pdf"), "Print PDF (B&W)"],
    [join(DIST, "print/plain-dharma-print-color.pdf"), "Print PDF (color)"],
    [join(DIST, "kdp/plain-dharma-kdp-interior-bw.pdf"), "KDP interior (B&W)"],
    [join(DIST, "kdp/plain-dharma-kdp-interior-color.pdf"), "KDP interior (color)"],
    [join(DIST, "kdp/plain-dharma-kdp-cover-bw.pdf"), "KDP cover (B&W)"],
    [join(DIST, "kdp/plain-dharma-kdp-cover-color.pdf"), "KDP cover (color)"],
  ].filter(([f]) => existsSync(f));
  if (builds.length) {
    groups.push({
      id: "builds",
      title: "Superseded book builds",
      kind: "build",
      date: builds.map(([f]) => fileDate(f)).sort().at(-1)!,
      locale: "en",
      note:
        "The last build of each artifact before the current published set — the June audiobook " +
        "and the June 30 typeset run. Kept so a citation to an older edition still resolves.",
      items: builds.map(([src, label]) => ({
        label: `${label} · ${fileDate(src)}`,
        src,
        path: `${PREFIX}/builds/${fileDate(src)}-${basename(src)}`,
      })),
    });
  }

  return groups;
}

// ── main ─────────────────────────────────────────────────────────────────────

type VersionEntry = { v: string; bytes: number; key?: string };
/** One row in archive.json — what the page actually renders. */
type IndexItem = {
  label: string;
  path: string;
  bytes: number;
  seconds: number | null;
  slug?: string;
  variant?: Variant;
  num?: string;
  name?: string;
};

async function main(): Promise<void> {
  const groups = buildGroups();
  if (!groups.length) {
    console.error("Nothing to archive — no source directories found.");
    process.exit(1);
  }

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const bytes = groups.reduce(
    (n, g) => n + g.items.reduce((m, i) => m + statSync(i.src).size, 0),
    0
  );
  console.log(
    `[archive] ${groups.length} groups, ${total} files, ${(bytes / 1e6).toFixed(1)} MB` +
      (DRY ? "  (dry run)" : "")
  );
  for (const g of groups) console.log(`  ${g.id.padEnd(24)} ${String(g.items.length).padStart(3)} files  ${g.title}`);
  if (DRY) return;

  const map: Record<string, VersionEntry> = JSON.parse(
    readFileSync(VERSION_MAP_PATH, "utf8")
  );

  // Upload every item and record it in the version map + the index.
  let done = 0;
  let skipped = 0;
  const index = groups.map((g) => ({ ...g, items: [] as IndexItem[] }));

  for (const [gi, g] of groups.entries()) {
    for (const item of g.items) {
      const bucketKey = bucketKeyFor(item.path);
      let bytes = map[item.path]?.bytes ?? 0;
      if (!INDEX_ONLY) {
        const buf = readFileSync(item.src);
        const v = createHash("sha256").update(buf).digest("hex").slice(0, 8);
        // Already published byte-for-byte — re-uploading 190 MB to change a
        // label would be pure waste, so re-runs only send what actually changed.
        if (map[item.path]?.v === v) {
          skipped += 1;
          bytes = buf.length;
        } else {
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(bucketKey, buf, { contentType: contentType(item.src), upsert: true });
        if (error) {
          console.error(`  ✗ ${bucketKey}: ${error.message}`);
          process.exit(1);
        }
        map[item.path] = {
          v,
          bytes: buf.length,
          ...(bucketKey !== item.path ? { key: bucketKey } : {}),
        };
        bytes = buf.length;
        }
      }
      index[gi].items.push({
        label: item.label,
        path: item.path,
        bytes: bytes || statSync(item.src).size,
        seconds: /\.(mp3|m4b)$/.test(item.src) ? duration(item.src) : null,
        ...(item.slug ? { slug: item.slug } : {}),
        ...(item.variant ? { variant: item.variant } : {}),
        ...(item.num ? { num: item.num } : {}),
        ...(item.name ? { name: item.name } : {}),
      });
      done += 1;
      if (done % 25 === 0) console.log(`  …${done}/${total}`);
    }
  }

  // The June 7 English masters are already in the bucket (backup-audio-masters.ts
  // put them there) but were never in the version map, so nothing could link
  // them. Hash the REMOTE bytes — two of them are older takes than anything on
  // disk, superseded by the June 26 front-matter re-record.
  const masters = await listRemote("audio-masters");
  const masterItems: IndexItem[] = [];
  for (const path of masters) {
    let bytes = map[path]?.bytes ?? 0;
    if (!INDEX_ONLY || !bytes) {
      const { data } = await supabase.storage.from(BUCKET).download(path);
      if (!data) continue;
      const buf = Buffer.from(await data.arrayBuffer());
      map[path] = { v: createHash("sha256").update(buf).digest("hex").slice(0, 8), bytes: buf.length };
      bytes = buf.length;
    }
    const [, , slug] = path.split("/");
    const { num, name } = splitTrack(path);
    masterItems.push({
      label: `${slug} — ${prettyTrack(path)}`,
      path,
      bytes,
      seconds: null,
      slug,
      variant: "master",
      ...(num ? { num } : {}),
      ...(name ? { name } : {}),
    });
  }
  if (masterItems.length) {
    index.push({
      id: "en-masters-2026-06-07",
      title: "English masters — current generation",
      kind: "masters",
      date: "2026-06-07",
      locale: "en",
      voice: "Theo Silk (UmQN7jS1Ee8B1czsUtQh)",
      note:
        "Un-stretched ElevenLabs output behind the narration on the site today. Two of these " +
        "— the front matter and the colophon — are older takes than what ships, superseded by " +
        "a June 26 re-record.",
      items: masterItems.sort((a, b) => a.path.localeCompare(b.path)),
    });
    console.log(`[archive] registered ${masterItems.length} existing audio-masters files`);
  }

  const sorted = Object.fromEntries(
    Object.keys(map).sort().map((k) => [k, map[k]])
  );
  writeFileSync(VERSION_MAP_PATH, JSON.stringify(sorted, null, 2) + "\n");

  writeFileSync(
    ARCHIVE_INDEX_PATH,
    JSON.stringify(
      { generated_at: new Date().toISOString(), groups: index },
      null,
      2
    ) + "\n"
  );

  console.log(
    INDEX_ONLY
      ? `[archive] indexed ${done} files (no uploads — --index-only)`
      : `[archive] published ${done} files under ${PREFIX}/ ` +
          `(${done - skipped} uploaded, ${skipped} already current)`
  );
  console.log(`[archive] wrote ${relative(ROOT, ARCHIVE_INDEX_PATH)} + merged ${relative(ROOT, VERSION_MAP_PATH)}`);
}

/** Every object key under a bucket prefix. */
async function listRemote(prefix: string, out: string[] = []): Promise<string[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error || !data) return out;
  for (const e of data) {
    const p = `${prefix}/${e.name}`;
    if (e.id === null) await listRemote(p, out);
    else if (e.name !== ".DS_Store") out.push(p);
  }
  return out;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
