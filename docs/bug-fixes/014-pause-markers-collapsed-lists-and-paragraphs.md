# Bug Fix: Pause Markers Collapsed Lists & Paragraphs

**Date:** 2026-06-08  
**Severity:** Medium — generated PDF/EPUB layout broken when pause markers appeared at list or paragraph boundaries  

---

## Symptom

In the generated PDF and EPUB formats, structured content collapsed onto single lines:

- **Mettā sutta**: the numbered list rendered as a continuous run: "1. The fragile… 2. The big…" instead of separate list items.
- **Four Noble Truths**: paragraphs merged together instead of stacking vertically.

The web display was unaffected (CSS hidden the markers anyway), but the ebook build broke because it removed pause markers incorrectly.

---

## Root Cause

The pause-marker stripping regex consumed **newlines** in addition to horizontal whitespace. Two identical functions stripped the markers:

- `scripts/lib/book-source.ts` — `stripPauseMarkers()`
- `apps/mobile/src/content/markdown.ts` — `stripPauseMarkers()`

**Before:**

```typescript
// Match horizontal whitespace around the marker BUT ALSO NEWLINES
return src.replace(
  /\s*\{\/\*\s*pause(?::\s*[\d.]+)?\s*\*\/\}\s*/gi,
  " "
);
```

The `\s*` on either end of the pattern matches any whitespace, including newlines. When a pause marker appeared at the end of a list item or paragraph, the outer `\s*` consumed the trailing newline, and replacement with `" "` (a single space) joined it to the next line. Markdown then saw a single paragraph, not a list.

Example:
```markdown
1. First item{/* pause */}
2. Second item

Becomes (newline consumed):
1. First item 2. Second item
```

---

## The Fix

Replace `\s*` with `[^\S\r\n]*` — a character class that matches **horizontal whitespace only**, preserving newlines.

**Before** (`scripts/lib/book-source.ts` and `apps/mobile/src/content/markdown.ts`):

```typescript
return src.replace(
  /\s*\{\/\*\s*pause(?::\s*[\d.]+)?\s*\*\/\}\s*/gi,
  " "
);
```

**After:**

```typescript
return src.replace(
  /[^\S\r\n]*\{\/\*\s*pause(?::\s*[\d.]+)?\s*\*\/\}[^\S\r\n]*/gi,
  " "
);
```

Now the regex:
- Strips **space and tab** around the marker (`[^\S\r\n]*`)
- Preserves **newlines** on both sides
- Replacement `" "` joins only horizontal neighbors, not lines

Result:
```markdown
1. First item{/* pause */}
2. Second item

Becomes (newline preserved):
1. First item
2. Second item
```

---

## Why It Was Hard to Find

The marker stripping worked fine in the **web player** (markers are already hidden by CSS), and in the **mobile app** (display didn't matter — the content was correct). The breakage only surfaced in the **PDF/EPUB pipeline**, which does markdown-to-rich-format conversion where list structure depends on newlines. The same code path was correct for HTML but incorrect for book formats, creating a context-specific failure that didn't show up in common workflows.

---

## Key Rule

**When stripping inline markers from markdown, never consume surrounding newlines.** Newlines are structural in markdown (they delimit list items, paragraphs, and block-level elements). Use `[^\S\r\n]*` (horizontal-only whitespace) instead of `\s*` (any whitespace) when you need to strip around a marker while preserving line structure.

---

## Files Involved

- `scripts/lib/book-source.ts` — `stripPauseMarkers()` function updated to use `[^\S\r\n]*` instead of `\s*`
- `apps/mobile/src/content/markdown.ts` — `stripPauseMarkers()` function updated to use `[^\S\r\n]*` instead of `\s*`
