# Bug Fix: Compare View Renders SuttaCentral Raw Markup as Text

**Date**: 2026-06-27
**Severity**: Low — cosmetic/display issue on new feature, no functional impact

---

## Symptom

On the new side-by-side compare page (`/read/[slug]/compare`), the canonical SuttaCentral text columns showed raw HTML markup as literal text instead of rendering it. Readers saw:

```
<em>all</em> consciousness instead of all consciousness
```

Instead of properly emphasized "all". The issue affected both the English (en) and Pāli columns.

---

## Root Cause

SuttaCentral's canonical text includes inline HTML markup:
- `<em>...</em>` for emphasis
- `<j>` as an unclosed verse line-join marker (end-of-line marker, not paired with closing tag)
- Other stray tags

The view rendered the paragraph text as a plain JavaScript string via `{p.en}` and `{p.pali}`, which interpolates text as a React string. Markup embedded in that string renders literally as text — the browser doesn't parse it as HTML because it's not actual HTML content, just a text node.

**Before** (`src/views/CompareView.tsx`):

```tsx
<div className="prose prose-dharma">
  {p.en}  {/* ← raw string; literal <em> tag shows on page */}
</div>

<div className="prose prose-dharma">
  {p.pali}  {/* ← raw string; literal <j> tag shows on page */}
</div>
```

---

## The Fix

Added a `renderMarkup(text)` helper that:
1. Splits the text on `<em>...</em>` boundaries
2. Renders `<em>` as a real React `<em>` element
3. Strips all other tags (including `<j>` and stray markup) via `.replace(/<[^>]+>/g, "")`
4. Applied to both canonical (en) and Pāli columns

**After** (`src/views/CompareView.tsx`):

```tsx
function renderMarkup(text: string) {
  // Split on <em>...</em>, convert matched sections to React <em> elements
  const parts = text.split(/(<em>.*?<\/em>)/);
  return parts.map((part, idx) => {
    if (part.startsWith("<em>") && part.endsWith("</em>")) {
      // Extract the text between the tags and render as <em>
      const content = part.replace(/<em>|<\/em>/g, "");
      return <em key={idx}>{content}</em>;
    }
    // Drop all other tags (including <j> and stray markup)
    const cleaned = part.replace(/<[^>]+>/g, "");
    return <span key={idx}>{cleaned}</span>;
  });
}

// Usage:
<div className="prose prose-dharma">
  {renderMarkup(p.en)}  {/* ← renders <em> elements, drops <j> */}
</div>

<div className="prose prose-dharma">
  {renderMarkup(p.pali)}  {/* ← renders <em> elements, drops <j> */}
</div>
```

Result: readers now see properly emphasized text ("all consciousness") and no visible markup.

---

## Key Rule

**When rendering third-party text that may contain inline markup, parse/sanitize it into React nodes — never interpolate a raw markup string as React text.** Three options:

1. **Parse into elements** (this fix): split on known tags, construct React elements for each part
2. **dangerouslySetInnerHTML** (not safe here): bypasses all escaping; only use if the text is trusted and sanitized
3. **Strip all markup** (simplest): use `.replace(/<[^>]+>/g, "")` if you don't need to preserve any styling

Here, we preserved emphasis (`<em>`) and dropped the rest. If you later need more markup types, extend `renderMarkup` to handle them — don't revert to raw interpolation.

---

## Files Involved

- `src/views/CompareView.tsx` — added `renderMarkup(text)` helper function and applied it to both `{p.en}` and `{p.pali}` interpolations
