# Bug #021: Version Map Rebuild Dropped Mandarin Audio Entries

**Date:** 2026-07-25  
**Severity:** High — production, affects both web and mobile app  
**Status:** Fixed

---

## Symptom

18 of the 37 Mandarin (zh) narration tracks returned HTTP 400 errors from the CDN on plaindharma.com and in the Expo mobile app. The affected tracks were the sutta body sections in all six texts. Title, opening, and drop tracks still played fine, which masked the severity of the problem.

Example failure: clicking a Mandarin reading's audio player showed silent drops or timeouts for mid-sutta sections, while intro narration worked normally.

---

## Root Cause

`scripts/upload-assets-to-supabase.ts` rebuilt `packages/content/asset-version.json` from scratch on every run by walking whatever existed under `public/`. This approach was safe only when `public/` held all media locally.

After heavy media moved to Supabase Storage offsite, `public/audio/zh/**/*.mp3` no longer existed on disk — the files lived exclusively in the bucket. A routine `pnpm upload-assets` walk silently deleted every zh mp3 entry from the version map:

```ts
// BEFORE: scripts/upload-assets-to-supabase.ts
const versionMap: Record<string, VersionEntry> = {}; // always from scratch

for (const file of collect()) {          // collect() walks public/ only
  const path = relative(PUBLIC_DIR, file);
  versionMap[path] = { v: sha256(buf).slice(0, 8), bytes, key? };
}
writeFileSync(VERSION_MAP_PATH, ...);    // anything not on disk is now gone
```

All 37 zh mp3 entries vanished. Only the 6 zh `manifest.json` files survived, because those are still committed locally and so `collect()` still found them.

### Why Only SOME Tracks Broke

Supabase Storage rejects non-ASCII object keys. Chinese filenames like `02-同一把火，烧遍一切.mp3` are stored under hashed ASCII keys (e.g., `8a99b3046ea53cc7.mp3`). The original-path → bucket-key mapping lives **only** in the version map's `key` field.

With zh entries gone from the map, `assetUrl()` in `packages/content/assets.ts` fell back to an un-versioned URL built from the raw path:

```ts
// packages/content/assets.ts
export function assetUrl(relPath: string): string {
  const path = normalize(relPath);
  const entry = VERSION_MAP[path];
  // Prefer the ASCII bucket key when one was recorded (non-ASCII originals).
  const url = `${ASSET_BASE}/${entry?.key ?? path}`;
  return entry ? `${url}?v=${entry.v}` : url;
}
```

With no entry, `entry?.key` is `undefined`, so the URL is built from the raw
`path` — the Chinese filename — and the cache-buster is dropped too.

For ASCII-named files (e.g., `00-title.mp3`), the fallback URL happened to match the real bucket key, so those kept working. For Chinese-named files, the raw path was rejected by the bucket with 400.

The call path: `manifest.json` `file` → `getAudioFileUrl()` in `packages/content/audio.ts` → `assetUrl('audio/zh/<slug>/<file>')` → missing entry → fallback URL → 400.

### Why It Was Hard to Find

- **Partial failure:** Only non-ASCII filenames broke, masking the root cause.
- **Silent deletion:** The version map is generated; its diff noise makes a missing entry easy to overlook in review.
- **Fallback logic:** The ASCII fallback in `assetUrl()` hid half the problem — some tracks still worked.
- **Found incidentally:** Discovered only while verifying an unrelated assumption about duplicate files in the bucket.

---

## The Fix

**Part 1: Preserve existing entries when rebuilding the version map**

**After** (`scripts/upload-assets-to-supabase.ts`):
```ts
const existing = existsSync(VERSION_MAP_PATH)
  ? JSON.parse(readFileSync(VERSION_MAP_PATH, "utf8"))
  : {};
const versionMap = { ...existing };   // start from the map, not the disk
// …then overwrite only the paths this run actually uploads
```

This change ensures `pnpm upload-assets` can never drop an entry — entries stay until explicitly pruned.

**Part 2: New script to reconcile the map against the bucket**

Created `scripts/sync-version-map.ts` (`pnpm sync-version-map`) to:

1. **List every bucket object** via Supabase
2. **Add missing entries** by hashing remote bytes
3. **Recover non-ASCII filenames** by reading committed manifests (the sole source of truth for which original names map to which hashed keys)
4. **Skip stale bucket audio** — under `audio/`, register ONLY objects a committed manifest actually references. Uploads are upsert-and-never-delete, so renaming a section strands the old object in the bucket forever; registering it would put a phantom track on `/assets`.
5. **Report orphans** — map entries whose bucket object is gone. `--prune` removes them.

Real example of (4): `audio/en/how-to-decide/04-now-run-it-the-other-way.mp3` and its `fast/` variant are still in the bucket, stranded when that section was renamed to `04-now-do-the-same-in-reverse.mp3`. `sync-version-map` reports them as stale and **leaves them unregistered** — it does not delete them from the bucket.

**Options:**
```bash
pnpm sync-version-map               # Reconcile and report
pnpm sync-version-map --prune       # Remove orphan entries
pnpm sync-version-map --dry-run     # Show what would change
```

**Result:** 37/37 zh tracks now resolve with 0 failures.  
Map went from 352 → 388 entries: 39 added (36 zh audio + 3 previously unregistered non-audio assets), 3 `.DS_Store` orphans pruned, 2 stale renamed tracks correctly skipped.

---

## Key Rule

**The asset version map describes the BUCKET, not the local disk. Never rebuild it from a local tree that no longer holds every asset.** Once assets move offsite, the map is the source of truth for the bucket's inventory. Always start from the existing map and update incrementally. Use a separate reconciliation script to recover any out-of-sync entries.

---

## Files Involved

- `scripts/upload-assets-to-supabase.ts` — changed `const versionMap = {}` to `const versionMap = { ...existing }` to preserve entries across rebuilds
- `scripts/sync-version-map.ts` — new script to reconcile the version map against the actual bucket, add missing entries by hashing remote bytes, and prune orphans
- `packages/content/asset-version.json` — the canonical map (now protected from silent deletions)
- `packages/content/assets.ts` — unchanged, but its un-versioned fallback in `assetUrl()` is what made the failure partial rather than total
- `packages/content/audio.ts` — unchanged; `getAudioFileUrl()` is the call path that reaches `assetUrl()`
- `packages/content/assets.ts` — `assetUrl()` fallback behavior (unchanged, but relied on during investigation)
- `packages/content/audio.ts` — `getAudioFileUrl()` call path (unchanged, but part of the failure chain)
