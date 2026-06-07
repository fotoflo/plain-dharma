# 008 — React Native: Offline Audio Downloads Not Recognized

**Date:** 2026-05-28  
**Severity:** High  
**Component:** apps/mobile audio downloads and playback  

## Symptom

After downloading audio for offline use in the React Native Expo app:
1. **Download state wasn't recognized**: The download button kept showing even though all manifest and MP3 files were present on disk; the More screen showed locales as not-downloaded.
2. **Offline playback failed**: When the device went offline, the audio player couldn't play the supposedly-downloaded files.

## Root Cause

Two separate bugs combined to break offline audio:

### Bug 1: Download Detection Relied on an Unreliable Flag

The `isLocaleDownloaded()` check used an AsyncStorage flag (`offline:<locale>` = "1") set at the end of `downloadLocale()`:

```typescript
// BEFORE: apps/mobile/src/audio/downloads.ts
export async function isLocaleDownloaded(locale: string): Promise<boolean> {
  const flag = await AsyncStorage.getItem(`offline:${locale}`);
  return flag === "1";
}

// In downloadLocale(), at the end:
await AsyncStorage.setItem(`offline:${locale}`, "1");
```

**Problem:** The AsyncStorage flag didn't reliably persist. Inspection of the simulator's RCTAsyncLocalStorage showed only user-preference keys; the offline flags were absent. This caused `isLocaleDownloaded()` to always return `false` even though all the actual files (manifest.json, all mp3 files) were physically present on disk under `Paths.document`.

### Bug 2: The Audio Queue Cached Network URLs and Never Rebuilt

The audio queue (react-native-track-player) was built once from streaming URLs. It was never rebuilt with downloaded local `file://` URLs because the `load()` call in AudioProvider deduped on a slug-only key:

```typescript
// BEFORE: apps/mobile/src/audio/AudioProvider.tsx
const loadKey = slug; // Only key is the slug

useEffect(() => {
  if (slug) {
    load(slug); // Deduped; never re-resolves URLs
  }
}, [slug, load]);
```

**Problem:** Even after files were downloaded, the queue still pointed to the remote streaming URLs. When offline, those URLs were unreachable, and playback failed.

## The Fix

### Fix 1: Check the Filesystem, Not a Flag

Made `isLocaleDownloaded()` check the actual files on disk. The filesystem is the source of truth for what's downloaded:

```typescript
// AFTER: apps/mobile/src/audio/downloads.ts
export async function isLocaleDownloaded(locale: string): Promise<boolean> {
  try {
    const docPath = await getDocumentPath(locale);
    // Check if at least the first sutta's manifest.json exists
    // (if manifest exists, the full download completed)
    const manifestPath = path.join(docPath, SUTTAS[0], 'manifest.json');
    const fileInfo = await fs.stat(manifestPath);
    return fileInfo.isFile();
  } catch {
    return false;
  }
}
```

Removed the AsyncStorage flag entirely. If the files are on disk, it's downloaded. Period.

### Fix 2: Rebuild the Queue When Download Status Changes

Modified `loadKey` to include a freshly-resolved first-track URL so the dedup key changes when local files become available:

```typescript
// AFTER: apps/mobile/src/audio/AudioProvider.tsx
const loadKey = useMemo(() => {
  // Re-resolve the first track URL so the key changes if we transition
  // from streaming -> local after download
  return `${slug}:${resolvedFirstTrackUrl}`;
}, [slug, resolvedFirstTrackUrl]);

useEffect(() => {
  if (slug && resolvedFirstTrackUrl) {
    load(slug);
  }
}, [slug, resolvedFirstTrackUrl, load]);
```

Now when a locale is downloaded, `resolvedFirstTrackUrl` changes from a network URL to a `file://` URL, the `loadKey` changes, and the queue rebuilds with local URLs. Playback stays uninterrupted for already-playing sections (the track-player queue diff is smart enough to only swap URLs, not restart).

## Key Rule

**For "is it downloaded?" checks, treat the filesystem as the source of truth, not a separate persisted flag.** A database, AsyncStorage key, or user-preference field can drift out of sync. The actual files on disk are the real answer.

Also: **re-resolve media sources on app state changes** (like after download) so a cached remote queue can switch to local files without needing a full playback restart.

## Files Involved

- `apps/mobile/src/audio/downloads.ts` — `isLocaleDownloaded()` refactored to check files on disk
- `apps/mobile/src/audio/AudioProvider.tsx` — `loadKey` now includes resolved first-track URL so queue rebuilds on download

## Worktree Note

Initial fixes were made in a git worktree (`.claude/worktrees/rn-mobile`) while the running Metro dev server was watching the main checkout. This caused the edits to appear not to work until they were consolidated back into the main branch, creating confusion about whether the fixes were effective.
