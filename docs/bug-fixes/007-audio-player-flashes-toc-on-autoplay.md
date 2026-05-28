# Bug Fix: Audio Player Flashes the TOC When Auto-Advancing Sections

**Date**: 2026-05-28
**Severity**: Low — jarring UI flicker during otherwise-correct playback

---

## Symptom

When one section finished and the next auto-played, the floating player briefly
collapsed from the **player view** (transport + scrubber) back to the **TOC**
(section list) and then re-expanded — a visible flash on every section boundary.
Same flicker on prev/next and when toggling the Slower/Faster pace mid-playback.

---

## Root Cause

The player derives its mode purely from `isPlaying`: `true` → player view,
`false` → TOC. On a section end, `handleEnded` unconditionally did:

```tsx
const handleEnded = useCallback(() => {
  setIsPlaying(false);                 // ← drops to TOC immediately
  const nextIdx = currentIdx + 1;
  if (nextIdx < sections.length) {
    window.setTimeout(() => loadSection(nextIdx, true), GAP_MS); // 1400ms later → back to player
  }
}, [currentIdx, sections.length, loadSection]);
```

So for the ~1.4s breath gap between sections the UI sat in TOC mode, then flipped
back when the next section played. Compounding it: `audio.load()` (called by
`loadSection`/`changeSpeed` on any programmatic source swap) fires a `pause`
event, and the `pause` handler also did `setIsPlaying(false)` — another flip.

---

## The Fix

Keep the player view up across programmatic track/pace changes with an
`autoAdvancingRef`, and only fall back to the TOC at the true end of the playlist.

- `handleEnded`: for a non-last section, set `autoAdvancingRef.current = true` and
  schedule the next load **without** `setIsPlaying(false)`. Only the final section
  calls `setIsPlaying(false)` (return to TOC).
- `loadSection`/`changeSpeed`: when the load will resume playback, set
  `autoAdvancingRef.current = true` before `audio.load()` and clear it once
  `play()` settles.
- `pause` handler: `if (autoAdvancingRef.current) return;` — ignore the
  load-induced pause so it doesn't flip to the TOC.

Manual pause (clicking the player) leaves the ref `false`, so it still returns to
the TOC as before.

---

## Key Rule

**Don't let a transient `pause`/reload between tracks drive a UI mode that's keyed
on play state.** Gate the play-state listeners with a "programmatic transition in
progress" ref so auto-advance, prev/next, and source swaps stay visually stable;
only user-initiated pauses change the visible mode.

---

## Files Involved

- `src/components/AudioPlayer.tsx` — added `autoAdvancingRef`; reworked
  `handleEnded`, `loadSection`, `changeSpeed`, and the `pause` handler.
