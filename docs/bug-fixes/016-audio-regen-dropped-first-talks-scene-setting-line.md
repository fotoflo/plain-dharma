# Bug Fix: Audio Regen Dropped First Talk's Scene-Setting Line

**Date:** 2026-06-08  
**Severity:** Low — re-recorded audio missing essential context, but only for one sutta  

---

## Symptom

When re-recording the audio narration for First Talk (`first-talk.mdx`), the opening scene-setting line disappeared:

```
At Varanasi, in the deer park at Isipatana, the Buddha addressed the five monks:
```

The audio started directly with the First Noble Truth instead, losing the geographic and narrative framing. The original recording had it; only fresh generations dropped it.

---

## Root Cause

The `parseMDX()` function in `scripts/generate-audio.ts` contained an overly broad cleanup that stripped **any** leading italic line:

```typescript
// BEFORE: scripts/generate-audio.ts
function parseMDX(filePath: string): Section[] {
  const raw = readFileSync(filePath, "utf8");

  let content = raw;
  // ...strip frontmatter...

  content = content.replace(/^#\s+.+\n?/, ""); // Strip the title
  content = content.replace(/^\*[^*\n]+\*\s*\n?/, ""); // ← PROBLEMATIC: strip leading *italic*

  // ...rest of parsing...
}
```

The regex `/^\*[^*\n]+\*\s*\n?/` matched any line starting with `*`, treated it as decorative markup, and deleted it.

For **first-talk**, the opening is:

```markdown
*At Varanasi, in the deer park at Isipatana, the Buddha addressed the five monks:*
```

This line is **semantic content**, not decoration — it sets the scene and must be narrated. But `parseMDX()` saw `*italic*` and deleted it, assuming it was optional markup (like a byline or subtitle).

---

## The Fix

Remove the leading italic-line strip entirely.

**Before:**

```typescript
content = content.replace(/^#\s+.+\n?/, ""); // Strip the title
content = content.replace(/^\*[^*\n]+\*\s*\n?/, ""); // ← Removes first-talk's scene-setting
```

**After:**

```typescript
content = content.replace(/^#\s+.+\n?/, ""); // Strip the title
// NOTE: do NOT strip a leading *italic* line. For first-talk that line is the
// scene-setting "At Varanasi, in the deer park at Isipatana, the Buddha
// addressed the five monks:" and must be narrated (stripEmphasis drops the *s).
```

The leading italic line is now preserved. `cleanForTTS()` later processes it (stripping the `*` markers via `stripEmphasis()`) and includes it in the narration.

---

## Why It Was Hard to Find

The strip was defensive programming — the author likely saw italic markup in other markdown files and assumed it was always decorative (like an attribution or subtitle). Only **first-talk** has a leading italic line that is also load-bearing semantic content. The breakage only appeared on audio **re-generation** with a fresh source read; if you updated the source text without re-running `generate-audio`, you'd never notice the change in output.

---

## Key Rule

**Don't strip a leading italic line from narration source — it can be semantic content.** When you encounter a markdown pattern that *usually* looks optional, check whether any sutta has that pattern in a required context. For Plain Dharma, the scene-setting opening is unique to first-talk; document the exception in a comment rather than deleting the pattern everywhere.

---

## Files Involved

- `scripts/generate-audio.ts` — removed the `/^\*[^*\n]+\*\s*\n?/` regex that was stripping first-talk's scene-setting line; added a comment explaining why the leading italic line must be preserved
