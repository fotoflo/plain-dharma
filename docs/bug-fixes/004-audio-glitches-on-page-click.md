# Bug Fix: Audio Glitches on Every Page Click

**Date**: 2026-05-27
**Severity**: Medium — audio stutters or stops on any page interaction, worse on mobile Safari

---

## Symptom

Audio occasionally stops or stutters when user clicks anywhere on the page, scrolls, or switches apps. The glitches are intermittent but noticeably worsen on mobile Safari. User must click play again to recover.

---

## Root Cause

`AudioPlayer`'s main listener-setup `useEffect` had an unstable dependency: `getFileUrl` was an inline arrow function created fresh on every render.

**The dependency chain:**
1. Parent component (`FloatingAudioPlayer`) re-renders for any reason (popup toggle, sibling state change, etc.)
2. Parent passes a new `getFileUrl` function instance (inline arrow = new reference every render)
3. `AudioPlayer`'s `useEffect` sees `getFileUrl` in its deps has changed
4. Effect tears down all six audio event listeners: `play`, `pause`, `ended`, `seeking`, `seeked`, `timeupdate`
5. Effect re-attaches all six listeners to the `<audio>` element
6. Meanwhile, user's click may have triggered a `play` or `pause` event on the `<audio>` element
7. In the brief window between teardown and re-attach, that event is missed
8. On mobile Safari, rapid event churn causes audible stutters as the audio element's state de-syncs from the UI

This is especially noticeable because `FloatingAudioPlayer` toggles its `open` state frequently, causing parent re-renders and invalidating `getFileUrl` every time.

---

## The Fix

Wrap `getFileUrl` in `useCallback` with stable deps `[audioBaseUrl]`. This ensures the function reference stays the same across parent re-renders, so the effect dependency check passes and the effect doesn't re-run unnecessarily.

**Before** (`src/components/AudioPlayer.tsx`):

```tsx
export function AudioPlayer({ getFileUrl }: AudioPlayerProps) {
  // ↓ NEW FUNCTION INSTANCE EVERY RENDER
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => { /* ... */ };
    const handlePause = () => { /* ... */ };
    // ... 4 more listeners ...

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    // ... attach 4 more ...

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      // ... remove 4 more ...
    };
  }, [getFileUrl]); // ← unstable: new function every render
}
```

**After** (`src/components/AudioPlayer.tsx`):

```tsx
// In the component that passes getFileUrl, or inside AudioPlayer if possible:
const stableGetFileUrl = useCallback(
  (fileId: string) => getFileUrl?.(fileId),
  [audioBaseUrl] // ← stable deps only
);

export function AudioPlayer({ getFileUrl }: AudioPlayerProps) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => { /* ... */ };
    const handlePause = () => { /* ... */ };
    // ... 4 more listeners ...

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    // ... attach 4 more ...

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      // ... remove 4 more ...
    };
  }, [stableGetFileUrl]); // ← now stable
}
```

The effect now only re-attaches listeners if `audioBaseUrl` actually changes, not on every parent re-render. Event listeners stay attached through all the incidental parent updates, so `play`/`pause`/`ended` events are never missed.

---

## Key Rule

**Callbacks passed to effect dependencies must be stable.** Inline functions get a new identity on every render and silently force the effect to re-run, tearing down and re-attaching any side-effect subscriptions (event listeners, timers, WebSocket handlers).

Always wrap unstable callbacks in `useCallback` with the minimal stable dep list. If the callback is passed from a parent, the parent should stabilize it too before passing it down.

---

## Files Involved

- `src/components/AudioPlayer.tsx` — wrapped `getFileUrl` in `useCallback` or equivalent stable reference
