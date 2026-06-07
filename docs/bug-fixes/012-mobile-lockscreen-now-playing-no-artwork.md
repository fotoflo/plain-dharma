# Bug Fix: Mobile Lock Screen Now Playing Widget Shows No Artwork

**Date**: 2026-06-03
**Severity**: Low — cosmetic, does not block playback

---

## Symptom

On the mobile app, audio plays fine in the background and when the phone is locked, but the iOS Now Playing widget (lock screen + Control Center) and the Android media notification show **no artwork/icon** — only text (title, artist, album).

**Note:** The iOS Simulator shows an entirely empty Now Playing module, which is a separate simulator limitation, not this bug. Lock-screen Now Playing only renders reliably on a physical device.

---

## Root Cause

In `apps/mobile/src/audio/AudioProvider.tsx`, the `toTracks()` function built `react-native-track-player` track objects with:
- `id`, `url`, `title`, `artist`, `album`, `duration`

But never set the `artwork` field. RNTP renders the lock-screen/Now Playing image from `track.artwork`; with it absent there is nothing to display.

Background audio worked correctly because `UIBackgroundModes: ["audio"]` and the RNTP playback service were already configured — only the metadata image was missing.

---

## The Fix

Added a module-level constant that resolves a bundled icon asset to a URI string, then pass it on every track in `toTracks()`.

**Before** (`apps/mobile/src/audio/AudioProvider.tsx`):

```typescript
function toTracks(
  sections: PlayerSection[],
  speed: Speed,
  album: string
) {
  return sections.map((s) => ({
    id: s.id,
    url: sectionUrl(s, speed),
    title: s.title,
    artist: "Plain Dharma",
    album,
    duration: sectionDuration(s, speed),
  }));
}
```

**After** (`apps/mobile/src/audio/AudioProvider.tsx`):

```typescript
// Bundled lock-screen / Now Playing artwork. A local require() (not a remote
// URL) so the icon renders offline too — downloaded audio plays without a
// network round-trip, and a URL artwork would silently show nothing there.
// Resolved to a URI string (what RNTP does internally) to satisfy its
// `artwork?: string` type cleanly in both dev and production bundles.
const ARTWORK = Image.resolveAssetSource(
  require("../../assets/images/icon.png")
).uri;

function toTracks(
  sections: PlayerSection[],
  speed: Speed,
  album: string
) {
  return sections.map((s) => ({
    id: s.id,
    url: sectionUrl(s, speed),
    title: s.title,
    artist: "Plain Dharma",
    album,
    artwork: ARTWORK,
    duration: sectionDuration(s, speed),
  }));
}
```

**Rationale:** A bundled local `require()` (resolved to a URI string) is used rather than a remote illustration URL. This ensures the icon renders **offline** for downloaded audio — a remote URL would silently show nothing when there is no network connectivity. The iOS lock screen and Android notification both pull the image from `track.artwork` on the active track.

---

## Key Rule

**When adding RNTP tracks, always set the `artwork` field.** Title, artist, and album alone leave the lock-screen widget imageless. Use a bundled local asset (via `Image.resolveAssetSource(require(...)).uri`) for offline reliability.

---

## Files Involved

- `apps/mobile/src/audio/AudioProvider.tsx` — added `ARTWORK` constant and `artwork: ARTWORK` field in `toTracks()` map
