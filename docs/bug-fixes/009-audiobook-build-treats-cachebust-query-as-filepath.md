# Bug Fix: Audiobook Build Treats Cache-Bust Query String as Filesystem Path

**Date**: 2026-05-29  
**Severity**: High — audiobook build completely broken, could not generate .m4b files

---

## Symptom

`pnpm build-audiobook` crashed immediately:

```
Error: Missing audio file: /Users/fotoflo/dev/plain-dharma/public/audio/en/first-talk/00-title.mp3?v=1779910130
```

The audiobook build failed every time, preventing any .m4b file generation. No audiobook could be produced.

---

## Root Cause

The shared audio manifest helper `getAudioManifest()` in `src/content/audio.ts` (now in the shared `@plain-dharma/content` package) intentionally appends a `?v=<mtime>` cache-bust query string to each audio section's `file` field:

```typescript
// In src/content/audio.ts (or @plain-dharma/content/audio.ts)
function getAudioManifest(locale: string) {
  return {
    sections: sections.map(section => ({
      ...section,
      file: `${section.file}?v=${getAudioMtime(section.file)}`
      // ^^ This query string is for the BROWSER; tells it to refetch when mp3 changes
    }))
  };
}
```

This is **correct and necessary** for the web player — it forces the browser to invalidate its cache when an mp3 is regenerated.

However, `scripts/build-audiobook.ts` consumed the same manifest and naively treated the `file` field as a filesystem path:

```typescript
// BEFORE: scripts/build-audiobook.ts
const audioPath = join(AUDIO_DIR, meta.slug, section.file);
// Tries to join: "/public/audio/en/first-talk/00-title.mp3?v=1779910130"
// This path doesn't exist because the query string is not part of the filename
```

This is a **category error**: the manifest's `file` field is a **web URL** (with cache-bust query), not a filesystem path.

---

## The Fix

Strip the query string before resolving the filesystem path. The cache-bust suffix is web-only and has no meaning on disk:

**Before** (`scripts/build-audiobook.ts` in the `gather()` function):

```typescript
const audioPath = join(AUDIO_DIR, meta.slug, section.file);
// file = "00-title.mp3?v=1779910130" → path doesn't exist
```

**After** (`scripts/build-audiobook.ts` in the `gather()` function):

```typescript
const fileName = section.file.split("?")[0]; // Strip query: "00-title.mp3"
const audioPath = join(AUDIO_DIR, meta.slug, fileName);
// Now the path exists on disk
```

The shared manifest was **not changed** — the `?v=` suffix is intentional and correct for the browser. Only the **consumer** (the script) needed to account for it.

---

## Key Rule

**Manifest `file` fields are web URLs with cache-bust queries; strip the query before any filesystem use.** Always separate concerns: what the browser needs (cache invalidation) vs. what the filesystem needs (actual filenames). When a shared manifest serves both audiences, sanitize it for each context.

---

## Files Involved

- `scripts/build-audiobook.ts` — `gather()` function now strips `?v=...` query before joining filesystem paths
- `src/content/audio.ts` (or `@plain-dharma/content/audio.ts`) — unchanged; the `?v=` cache-bust is correct and intentional
