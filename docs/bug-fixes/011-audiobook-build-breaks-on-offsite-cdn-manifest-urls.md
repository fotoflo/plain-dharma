# Bug Fix: Audiobook Build Breaks on Offsite CDN Manifest URLs

**Date:** 2026-06-03  
**Severity:** High — audiobook build completely broken after offsite asset storage migration  

---

## Symptom

`pnpm build-audiobook` crashed immediately after PR #11 (offsite asset storage migration):

```
Error: Missing audio file: /Users/fotoflo/dev/plain-dharma/public/audio/en/first-talk/https:/ffoiltrarbdbibmymlqm.supabase.co/storage/v1/object/public/assets/audio/en/first-talk/00-title.mp3
```

The script tried to join a full Supabase CDN URL as if it were a local relative path, yielding a nonsensical filesystem address. No .m4b files could be generated.

---

## Root Cause

PR #11 migrated audio assets to Supabase offsite storage. The manifest helper `getAudioManifest()` in `@plain-dharma/content/audio.ts` was updated to resolve each section's `file` field to its full CDN URL via `assetUrl()`:

```typescript
// In @plain-dharma/content/audio.ts (post-PR #11)
function getAudioManifest(locale: string) {
  return {
    sections: sections.map(section => ({
      ...section,
      file: assetUrl(`audio/${locale}/${slug}/${section.file}`)
      // ^^ Now a FULL CDN URL, not a bare filename
    }))
  };
}
```

This is **correct for the web player** — it needs full URLs to fetch from the CDN.

However, `scripts/build-audiobook.ts` was not updated alongside the migration. It still assumed `file` was a bare filename and naively extracted it:

```typescript
// BEFORE: scripts/build-audiobook.ts (unchanged)
const fileName = section.file.split("?")[0]; // e.g. "https://supabase.co/..."
const audioPath = join(AUDIO_DIR, meta.slug, fileName);
// Tries to join: "/public/audio/en/first-talk/https://supabase.co/storage/..."
// This path doesn't exist — it's garbage
```

The script stitches **local** mp3 files into the audiobook, so it needs on-disk paths. But it received full CDN URLs and tried to join them as filenames, creating invalid paths.

---

## The Fix

Extract only the **filename basename** from the CDN URL, stripping both the directory path and any cache-bust query string:

**Before** (`scripts/build-audiobook.ts` — all three extraction sites):

```typescript
const fileName = section.file.split("?")[0];
const audioPath = join(AUDIO_DIR, meta.slug, fileName);
// "https://supabase.co/storage/v1/.../00-title.mp3?v=123" → fails to exist
```

**After** (`scripts/build-audiobook.ts` — all three extraction sites):

```typescript
const fileName = section.file.split("?")[0].split("/").pop()!;
const audioPath = join(AUDIO_DIR, meta.slug, fileName);
// "https://supabase.co/storage/v1/.../00-title.mp3?v=123" → "00-title.mp3" ✓
```

The one-liner `.split("/").pop()!` handles both scenarios:
- **Local file**: `"00-title.mp3?v=123"` → `"00-title.mp3"`
- **CDN URL**: `"https://supabase.co/storage/.../00-title.mp3?v=123"` → `"00-title.mp3"`

---

## Key Rule

**When a manifest field's semantic meaning changes from "local filename" to "resolved CDN URL", every consumer that still needs the on-disk file must extract the basename.** Do not assume `file` is a filename — if the manifest migrates to offsite storage, sanitize it for each context. The web player consumes full URLs; build scripts consume basenames.

---

## Files Involved

- `scripts/build-audiobook.ts` — updated all three `section.file` extraction sites to `.split("?")[0].split("/").pop()!` to extract the filename basename from a CDN URL
