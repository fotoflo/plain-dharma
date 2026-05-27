# Bug Fix: AudioPlayer Pauses When Popup Closes

**Date**: 2026-05-27
**Severity**: Medium — audio playback stops unexpectedly, disrupts listening flow

---

## Symptom

User opens the floating audio player popup, clicks play, then clicks outside to close the popup. Audio stops playing entirely. Must reopen the popup and click play again to resume.

---

## Root Cause

`FloatingAudioPlayer` conditionally rendered `{open && <AudioPlayer />}`. When the `open` state flipped to false, React unmounted the entire `AudioPlayer` component, destroying the underlying `<audio>` HTML element in the process. Destroying the element stops all playback immediately.

**The problem with conditional rendering of stateful components:**
- React unmounting = DOM element destroyed
- Audio element destroyed = playback stops, event listeners cleaned up, playback position lost
- No way to resume from where you paused without a full re-load

---

## The Fix

Changed from conditional rendering to always-mounted + CSS visibility toggle.

**Before** (`src/components/FloatingAudioPlayer.tsx`):

```tsx
return (
  <>
    <button onClick={() => setOpen(!open)}>Toggle Audio</button>
    {open && <AudioPlayer getFileUrl={getFileUrl} />}  {/* ← unmounts when open=false */}
  </>
);
```

**After** (`src/components/FloatingAudioPlayer.tsx`):

```tsx
return (
  <>
    <button onClick={() => setOpen(!open)}>Toggle Audio</button>
    <div className={open ? "" : "hidden"}>
      <AudioPlayer getFileUrl={getFileUrl} />  {/* ← always mounted, visibility toggled */}
    </div>
  </>
);
```

The `<audio>` element now stays in the DOM at all times. Only its visibility changes via the `hidden` class. Playback, event listeners, and playback position persist across the toggle.

---

## Key Rule

**Hidden ≠ Unmounted.** Stateful components that own long-lived resources — audio elements, video players, WebSocket connections, timers, or any external I/O — must stay mounted across UI toggles. Always use CSS (`hidden` class, `display: none`, `visibility: hidden`, `opacity: 0`) to hide them, never conditional rendering.

If the component must be unmounted (e.g., to save memory on deeply nested popups), save the playback state to a parent context or URL so you can restore it when re-mounting.

---

## Files Involved

- `src/components/FloatingAudioPlayer.tsx` — changed conditional render to CSS-hidden wrapper
