/**
 * Upload the heavy binary assets to the PUBLIC Supabase Storage bucket `assets`
 * and write the version map the site reads at build time.
 *
 * Why: the mp3s, illustrations, and download bundles used to live in git and be
 * served from Vercel /public. Regenerating audio re-committed fresh blobs, so
 * .git ballooned. They now live in object storage + CDN; this script publishes
 * them and records a content hash + byte size per file in
 * packages/content/asset-version.json (committed, tiny). assetUrl() in
 * packages/content/assets.ts builds CDN URLs from that map.
 *
 * What's uploaded (mirrors the bucket layout assetUrl expects):
 *   audio/<locale>/<slug>/<file>.mp3  + fast/<file>.mp3  + manifest.json
 *     (the candidates/ TTS working takes are skipped)
 *   illustrations/<file>.png          + originals.zip
 *   downloads/<file>                   (m4b, pdf, epub, jpg covers, *.zip)
 *
 * Requires in .env.local (upload only — reading a public bucket needs no key):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY            (sb_secret_…)  — or —  SUPABASE_SERVICE_ROLE_KEY
 *   Get one: https://supabase.com/dashboard/project/ffoiltrarbdbibmymlqm/settings/api-keys
 *
 * Run (after `pnpm build-remix-assets` so the zips exist):
 *   pnpm upload-assets
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = join(ROOT, "public");
const VERSION_MAP_PATH = join(
  ROOT,
  "packages",
  "content",
  "asset-version.json"
);
const BUCKET = "assets";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

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

function contentType(path: string): string {
  switch (extname(path).toLowerCase()) {
    case ".mp3":
      return "audio/mpeg";
    case ".json":
      return "application/json";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".pdf":
      return "application/pdf";
    case ".epub":
      return "application/epub+zip";
    case ".m4b":
      return "audio/mp4";
    case ".zip":
      return "application/zip";
    case ".mdx":
    case ".md":
      return "text/markdown; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

/**
 * Supabase Storage rejects non-ASCII object keys (it decodes percent-encoding
 * before validating, so encoding doesn't help). Some zh narration files keep
 * Chinese names (e.g. `02-同一把火，烧遍一切.mp3`). For any path segment that
 * isn't already ASCII-safe, substitute a deterministic `<sha1>.<ext>` so the
 * bucket key is pure ASCII. The local filename is unchanged; assetUrl maps the
 * original (Chinese) relative path to this key via the version map's `key`.
 */
function bucketKeyFor(relKey: string): string {
  return relKey
    .split("/")
    .map((seg) => {
      if (/^[A-Za-z0-9._-]+$/.test(seg)) return seg;
      const dot = seg.lastIndexOf(".");
      const ext = dot >= 0 && /^\.[A-Za-z0-9]+$/.test(seg.slice(dot))
        ? seg.slice(dot)
        : "";
      return createHash("sha1").update(seg).digest("hex").slice(0, 16) + ext;
    })
    .join("/");
}

/** Recursively yield files under `dir`, skipping any `candidates/` subtree. */
function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === "candidates") continue;
      yield* walk(join(dir, entry.name));
    } else if (entry.isFile()) {
      yield join(dir, entry.name);
    }
  }
}

/**
 * Collect the absolute paths to upload. Mirrors the bucket key 1:1 with the
 * file's path relative to public/, so public/audio/en/x.mp3 → audio/en/x.mp3.
 * The whole of audio/ (mp3s + manifests, minus candidates/) and downloads/
 * (book files, zips, AND text/*.mdx) is uploaded so the bucket is a complete
 * mirror — the next.config /downloads redirect can then send any legacy path to
 * the CDN without a hole. Illustrations: PNGs + originals.zip (skip _backup/).
 */
function collect(): string[] {
  const out: string[] = [];

  const audioDir = join(PUBLIC_DIR, "audio");
  if (existsSync(audioDir)) out.push(...walk(audioDir));

  const dlDir = join(PUBLIC_DIR, "downloads");
  if (existsSync(dlDir)) out.push(...walk(dlDir));

  const illDir = join(PUBLIC_DIR, "illustrations");
  if (existsSync(illDir)) {
    for (const f of readdirSync(illDir, { withFileTypes: true })) {
      if (!f.isFile()) continue; // skips _backup/
      if (f.name.endsWith(".png") || f.name === "originals.zip") {
        out.push(join(illDir, f.name));
      }
    }
  }
  return out;
}

async function ensureBucket(): Promise<void> {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) {
    if (!data.public) {
      await supabase.storage.updateBucket(BUCKET, { public: true });
      console.log(`[assets] made bucket "${BUCKET}" public`);
    }
    return;
  }
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
  });
  if (error) throw error;
  console.log(`[assets] created public bucket "${BUCKET}"`);
}

async function main(): Promise<void> {
  await ensureBucket();

  const files = collect();
  if (files.length === 0) {
    console.error("No assets found under public/ — nothing to upload.");
    process.exit(1);
  }

  const versionMap: Record<
    string,
    { v: string; bytes: number; key?: string }
  > = {};
  let uploaded = 0;
  let bytes = 0;

  for (const file of files) {
    // `path` is the original relative path (the key callers pass to assetUrl,
    // possibly containing Chinese). `bucketKey` is the ASCII key Supabase will
    // accept — equal to `path` for ASCII files.
    const path = relative(PUBLIC_DIR, file).split(/[\\/]/).join("/");
    const bucketKey = bucketKeyFor(path);
    const buf = readFileSync(file);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(bucketKey, buf, { contentType: contentType(file), upsert: true });
    if (error) {
      console.error(`  ✗ ${bucketKey}: ${error.message}`);
      process.exit(1);
    }
    versionMap[path] = {
      v: createHash("sha256").update(buf).digest("hex").slice(0, 8),
      bytes: statSync(file).size,
      ...(bucketKey !== path ? { key: bucketKey } : {}),
    };
    uploaded += 1;
    bytes += buf.length;
    if (uploaded % 25 === 0) console.log(`  …${uploaded}/${files.length}`);
  }

  // Sort keys so the committed map has a stable, reviewable diff.
  const sorted = Object.fromEntries(
    Object.keys(versionMap)
      .sort()
      .map((k) => [k, versionMap[k]])
  );
  writeFileSync(VERSION_MAP_PATH, JSON.stringify(sorted, null, 2) + "\n");

  console.log(
    `[assets] uploaded ${uploaded} files (${(bytes / 1e6).toFixed(1)} MB) ` +
      `to public bucket "${BUCKET}"`
  );
  console.log(
    `[assets] wrote ${relative(ROOT, VERSION_MAP_PATH)} (${uploaded} entries)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
