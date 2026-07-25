# Bug #020: Dark Mode Book Mockup Color Mismatch

**Date:** 2026-07-25  
**Severity:** Low — cosmetic  
**Status:** Fixed

## Symptom

On the home and download pages in dark mode, the 3D book mockup image rendered as a visibly lighter rectangle/box that did not match the page's dark "night sky" background. The background colors clearly did not align, creating an unpolished, out-of-place appearance.

## Root Cause

The book mockup had been refactored to use two opaque images with the studio backdrop baked directly into the render — a light cream backdrop shown in light mode and a dark navy backdrop shown in dark mode, swapped via `dark:hidden` / `hidden dark:block` CSS.

This approach was fundamentally flawed: an opaque rectangle can never match a CSS background exactly. The AI-generated dark render's studio navy (~#1a2436, with a vignette fade) was noticeably lighter than the page's near-black starry background (~#0b1220), so it read as a visible box. The baked background pattern inherently fights the themed page background:

```
<!-- Before (broken) -->
<img src="book-light-backdrop.png" className="dark:hidden" />
<img src="book-dark-backdrop.png" className="hidden dark:block" />
```

No matter which image you show, its opaque background will never perfectly match the page's dynamic CSS theme.

## Why It Was Hard to Find

The transparent-cutout approach that would solve this had been abandoned earlier because the cutout kept failing. Gemini bakes a gradient backdrop and soft contact shadow into every render, and the old single-color chroma-key (fixed-color removal) left a gray halo around the book that couldn't be removed cleanly.

The cutout appeared impossible to execute without introducing artifacts.

## The Fix

Reverted to a single transparent cut-out that floats on both themes, paired with a CSS drop-shadow. The cutout was made robust by rendering the book on a **dark backdrop** and removing it with a **luma flood-fill from the image border**.

**New algorithm:**
1. Render the book on a dark backdrop (matching the dark theme's night sky)
2. Use a luma-based flood-fill starting from the image borders
3. Clear every edge-connected pixel with luma ≤ 175 (dark values)
4. The bright cream/yellow book and black cover text survive (luma > threshold or not edge-connected)
5. Interior black elements (cover text, shadows inside the book) stay opaque (not reachable from borders)

This approach survives Gemini's baked gradient and soft shadow, which the old fixed-color chroma-key could not handle.

**Before & After:**
- **Before:** Two opaque images with baked backdrops, swapped by `dark:hidden` → visible mismatch rectangle
- **After:** One transparent PNG floating on both themes + CSS drop-shadow (original design, now working)

### Sharp Buffer Bugs Fixed During This Work

While implementing the luma flood-fill, two sharp image-processing bugs were corrected:

1. **Scanline striping from incomplete buffer mode:** `.blur().toBuffer()` without `.raw()` produced striped output. Fixed by ensuring `.raw()` is called when needed.
2. **Grayscale matte with no alpha channel broke dest-in compositing:** A grayscale matte without an alpha channel made `dest-in` a no-op. Fixed by assembling the full RGBA output in one pass.

Final approach: assemble the complete RGBA buffer in a single pass and encode once.

## Key Rule

**A book or product image shown over a themed page must be a transparent cut-out with no baked background — never bake a background into the image.** Opaque backdrops always fight the page theme. If the cutout leaves artifacts (halos, fringing), improve the cutout algorithm (e.g., luma flood-fill from borders) rather than falling back to baking. A floating transparent element with a subtle drop-shadow integrates cleanly with any theme.

## Files Involved

- `scripts/cutout-book.ts` — rewritten to luma flood-fill algorithm
- `scripts/generate-book-photo.ts` — dark backdrop + blank spine setup
- `src/app/download/page.tsx` — reverted to single transparent `<img>` + drop-shadow
- `src/views/HomeView.tsx` — reverted to single transparent `<img>` + drop-shadow
- `packages/content/asset-version.json` — cache-bust entry
- Dropped orphaned `-dark` asset variant (no longer needed)
