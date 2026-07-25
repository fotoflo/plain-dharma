/**
 * Reconcile packages/content/asset-version.json with what's ACTUALLY in the
 * public `assets` bucket. The map — not the local disk — is what `assetUrl()`
 * reads, so any bucket object missing from it is unreachable or mis-addressed.
 *
 * Why this exists: `upload-assets` used to rebuild the map purely from files
 * under `public/`. Once the heavy media moved offsite, `public/audio/zh/**` no
 * longer existed locally, so a routine `pnpm upload-assets` silently dropped
 * every zh mp3 entry. ASCII-named tracks survived on assetUrl's un-versioned
 * fallback, but the 18 Chinese-named ones are stored under hashed ASCII bucket
 * keys (Supabase rejects non-ASCII keys) and the `key` mapping lives ONLY in the
 * map — so they 400'd on the site and in the mobile app until this ran.
 *
 * What it does (read-only against the bucket — it never uploads or deletes):
 *   • adds a map entry for every bucket object missing from the map, hashing the
 *     REMOTE bytes (the bucket is the source of truth for what's served)
 *   • restores the `key` mapping for non-ASCII paths by matching the hashed
 *     bucket key back to the original filename, using local files or manifests
 *   • reports map entries with no bucket object (orphans); `--prune` removes them
 *
 * Run:
 *   pnpm sync-version-map              # add missing, report orphans
 *   pnpm sync-version-map --prune      # also drop orphaned entries
 *   pnpm sync-version-map --dry-run    # report only, write nothing
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION_MAP_PATH = join(ROOT, "packages/content/asset-version.json");
const AUDIO_DIR = join(ROOT, "public", "audio");
const BUCKET = "assets";
const PRUNE = process.argv.includes("--prune");
const DRY = process.argv.includes("--dry-run");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "ERROR: need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY " +
      "(or SUPABASE_SERVICE_ROLE_KEY) in .env.local."
  );
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

type VersionEntry = { v: string; bytes: number; key?: string };

/** Same hashing rule as upload-assets-to-supabase.ts — must stay in sync. */
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

/** Every object key in the bucket. */
async function listBucket(prefix = "", out: string[] = []): Promise<string[]> {
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: 1000, offset });
    if (error) throw new Error(`${prefix}: ${error.message}`);
    if (!data?.length) break;
    for (const e of data) {
      const p = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.id === null) await listBucket(p, out);
      else if (e.name !== ".DS_Store") out.push(p);
    }
    if (data.length < 1000) break;
    offset += data.length;
  }
  return out;
}

/**
 * Build bucketKey → original path for every audio file the committed manifests
 * actually reference. This does double duty:
 *
 *   1. It recovers the original (often Chinese) filename behind a hashed bucket
 *      key, which is the whole reason `key` exists in the map.
 *   2. It defines what counts as LIVE audio. Renaming a section leaves the old
 *      object in the bucket forever (uploads are upsert, never delete) — e.g.
 *      `audio/en/how-to-decide/04-now-run-it-the-other-way.mp3`, orphaned when
 *      that section became `04-now-do-the-same-in-reverse.mp3`. Registering
 *      those would put phantom tracks on /assets, so anything under `audio/`
 *      that no manifest names is skipped.
 */
function manifestAudio(): Map<string, string> {
  const out = new Map<string, string>();
  const add = (path: string) => out.set(bucketKeyFor(path), path);
  if (!existsSync(AUDIO_DIR)) return out;
  for (const locale of readdirSync(AUDIO_DIR)) {
    const localeDir = join(AUDIO_DIR, locale);
    let slugs: string[];
    try {
      slugs = readdirSync(localeDir);
    } catch {
      continue;
    }
    for (const slug of slugs) {
      const mf = join(localeDir, slug, "manifest.json");
      if (!existsSync(mf)) continue;
      add(`audio/${locale}/${slug}/manifest.json`);
      let manifest: { sections?: Array<{ file?: string; fileFast?: string }> };
      try {
        manifest = JSON.parse(readFileSync(mf, "utf8"));
      } catch {
        continue;
      }
      for (const s of manifest.sections ?? []) {
        if (s.file) {
          add(`audio/${locale}/${slug}/${s.file}`);
          add(`audio/${locale}/${slug}/fast/${s.file}`);
        }
        if (s.fileFast) add(`audio/${locale}/${slug}/fast/${s.fileFast}`);
      }
    }
  }
  return out;
}

async function main(): Promise<void> {
  const map: Record<string, VersionEntry> = JSON.parse(
    readFileSync(VERSION_MAP_PATH, "utf8")
  );
  const objects = await listBucket();
  const live = manifestAudio();

  // Every bucket key the map currently addresses.
  const addressed = new Set(
    Object.entries(map).map(([path, e]) => e.key ?? path)
  );

  const unaddressed = objects.filter((o) => !addressed.has(o));
  // Under `audio/`, only manifest-referenced objects are live; elsewhere
  // (illustrations, downloads, archive) every object is real.
  const missing = unaddressed.filter((o) => !o.startsWith("audio/") || live.has(o));
  const stale = unaddressed.filter((o) => o.startsWith("audio/") && !live.has(o));
  const orphans = Object.entries(map).filter(
    ([path, e]) => !objects.includes(e.key ?? path)
  );

  console.log(
    `[sync] bucket=${objects.length} objects, map=${Object.keys(map).length} entries`
  );
  console.log(
    `[sync] missing from map: ${missing.length}, orphaned entries: ${orphans.length}, ` +
      `stale bucket audio (skipped): ${stale.length}`
  );

  for (const o of orphans) console.log(`  orphan  ${o[0]}`);
  for (const s of stale) console.log(`  stale   ${s}  (no manifest references it)`);
  if (DRY) {
    for (const m of missing)
      console.log(`  missing ${m}${live.get(m) !== m ? `  → ${live.get(m)}` : ""}`);
    return;
  }

  let added = 0;
  let unnamed = 0;
  for (const objKey of missing) {
    const { data, error } = await supabase.storage.from(BUCKET).download(objKey);
    if (error || !data) {
      console.error(`  ✗ ${objKey}: ${error?.message ?? "no data"}`);
      continue;
    }
    const buf = Buffer.from(await data.arrayBuffer());
    // Prefer the true (possibly non-ASCII) path so callers can address it the
    // way manifests name it; fall back to the raw key.
    const path = live.get(objKey) ?? objKey;
    if (path === objKey && objKey !== bucketKeyFor(objKey)) unnamed += 1;
    map[path] = {
      v: createHash("sha256").update(buf).digest("hex").slice(0, 8),
      bytes: buf.length,
      ...(path !== objKey ? { key: objKey } : {}),
    };
    added += 1;
    if (added % 20 === 0) console.log(`  …${added}/${missing.length}`);
  }

  let pruned = 0;
  if (PRUNE) {
    for (const [path] of orphans) {
      delete map[path];
      pruned += 1;
    }
  }

  const sorted = Object.fromEntries(
    Object.keys(map).sort().map((k) => [k, map[k]])
  );
  writeFileSync(VERSION_MAP_PATH, JSON.stringify(sorted, null, 2) + "\n");

  console.log(
    `[sync] added ${added}, pruned ${pruned}, map now ${Object.keys(sorted).length} entries`
  );
  if (unnamed) {
    console.log(
      `[sync] WARNING: ${unnamed} hashed objects had no recoverable original ` +
        `filename — registered under their hashed key only.`
    );
  }
  console.log(`[sync] wrote ${relative(ROOT, VERSION_MAP_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
