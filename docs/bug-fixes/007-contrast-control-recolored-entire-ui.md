# Bug Fix: Contrast Control Recolored Entire UI

**Date**: 2026-05-28
**Severity**: Medium — reading controls become impossible to see/click when contrast is adjusted

---

## Symptom

User opens the contrast control in the reading panel and adjusts the slider. Instead of just the reading text changing color, the entire UI chrome recolors — including the control panel itself, the navigation bar, and the footer. The controls become nearly invisible (text and background blur together) and the entire page appearance shifts unexpectedly.

Reported as: "the text selector changes the font color as well."

---

## Root Cause

The contrast classes in `src/app/globals.css` were overriding the global `--color-text` custom property:

```css
html.contrast-low  { --color-text: #5C4D3A; }
html.contrast-med  { --color-text: #1F1812; }
html.contrast-high { --color-text: #000000; }
```

But in the same file, `--color-ink` is aliased to `--color-text`:

```css
:root {
  --color-ink: var(--color-text);
}
```

The entire UI chrome — navigation, footer, buttons, and the reading-controls panel itself — paints text via Tailwind's `text-ink` utility class, which consumes `--color-ink`. So when the contrast control modified `--color-text`, the cascade affected every `text-ink` element in the document, including the control panel the user was actively clicking. The control appeared to recolor itself and became hard to use.

---

## The Fix

Introduced a dedicated `--reading-ink` custom property consumed **only** by reading content, separate from global chrome. The contrast classes now override `--reading-ink` (and the background color variable) instead of `--color-text`.

**Before** (`src/app/globals.css`):

```css
:root {
  --color-text: #1F1812;
  --color-ink: var(--color-text);  /* leaks into text-ink everywhere */
}

html.contrast-low  { --color-text: #5C4D3A; }
html.contrast-med  { --color-text: #1F1812; }
html.contrast-high { --color-text: #000000; }  /* cascades to all text-ink elements */
```

**After** (`src/app/globals.css`):

```css
:root {
  --color-text: #1F1812;
  --color-ink: var(--color-text);  /* chrome only */
  --reading-ink: var(--color-text);  /* reading content default */
}

/* Light mode */
html:not(.dark).contrast-low   { --reading-ink: #5C4D3A; --color-bg: #fdfbf8; }
html:not(.dark).contrast-med   { --reading-ink: #1F1812; --color-bg: #ffffff; }
html:not(.dark).contrast-high  { --reading-ink: #000000; --color-bg: #ffffff; }

/* Dark mode */
html.dark.contrast-low   { --reading-ink: #b8a892; --color-bg: #0a0905; }
html.dark.contrast-med   { --reading-ink: #d4cec3; --color-bg: #0f0c08; }
html.dark.contrast-high  { --reading-ink: #ffffff; --color-bg: #000000; }
```

Reading content classes (`.prose-dharma`, `.preface-dharma`, `.closing-dharma`, `.drop-dharma`) now consume `--reading-ink` instead of `--color-text`:

```css
.prose-dharma {
  color: var(--reading-ink);  /* isolated from global chrome */
}
```

Chrome remains stable on `--color-ink`, which is never overridden by contrast adjustments.

---

## Key Rule

**Reading tokens that a control mutates must be scoped to the content they target, never aliased into global chrome tokens.** Contrast/accessibility controls are content transformations, not global theme changes. Separate the token (e.g., `--reading-ink` vs `--color-ink`) so the control affects only the intended surface. If a token must cascade (e.g., inheriting a font-size), use a selector specific to the element tree (`.prose-dharma` subtree), never a root-level alias.

---

## Files Involved

- `src/app/globals.css` — added `--reading-ink` token, moved contrast overrides from `--color-text` to `--reading-ink`, added mode-aware contrast classes (light + dark)
- `src/components/Preface.tsx`, `src/components/Closing.tsx`, `src/components/Drop.tsx` — gained the `.preface-dharma`/`.closing-dharma`/`.drop-dharma` classes that consume `--reading-ink` (via `color-mix`); their hardcoded `text-ink/*` utilities were removed
- `src/components/NightSky.tsx` — suppresses the star field in the flat-black dark contrast modes
