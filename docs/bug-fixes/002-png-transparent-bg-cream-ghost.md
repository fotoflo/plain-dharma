# Bug Fix: Generated Illustrations Had Visible Cream-Square Backgrounds

**Date**: 2026-05-26
**Severity**: Medium — cosmetic, but visible on the homepage hero for all visitors

---

## Symptom

The six Gemini-generated illustrations were placed on the homepage hero with a transparent background intent, but visible cream rectangles surrounded the line-art figures. The images did not blend with the `#F5EFE0` page background — instead they sat inside obvious bounding boxes.

---

## Root Cause

Gemini returned PNGs with near-white backgrounds (approximately `#FCF6E9`), not the requested `#F5EFE0`. Two approaches that failed:

1. Setting the `<Image>` element's CSS background to the page color — the colors didn't match closely enough.
2. A single ImageMagick `-fuzz X% -transparent white` pass — this removed most of the background but left **low-alpha residue** pixels (around 4% alpha) in the areas where the background color transitioned into the watercolor wash. These residual pixels were invisible at 100% opacity but showed as a faint cream ghost on the page.

**Compounding caveat — backup integrity**: A failed agent created a `_backup/` directory *after* the first transparency pass, not before. When a subsequent agent re-processed "from backup," it was reprocessing already-partially-transparent files, baking the artifact in further.

---

## The Fix

A two-pass ImageMagick transparency approach:

**Pass 1** — remove the bulk background:

```bash
magick input.png -fuzz 22% -transparent white output.png
```

`-fuzz 22%` makes near-white pixels (within 22% color distance of pure white) transparent. This catches the solid background but leaves low-alpha residue at watercolor edges.

**Pass 2** — clamp residual low-alpha pixels:

```bash
magick output.png -channel A -level 15%,100% +channel final.png
```

`-channel A -level 15%,100%` remaps the alpha channel: any pixel below 15% alpha becomes fully transparent (0), while values above are preserved and linearly remapped upward. This kills the cream ghost without hard-edging the soft watercolor wash (whose meaningful alpha values are well above 15%).

**Combined into the processing script** (`scripts/transparentize-illustrations.ts`):

```bash
# Step 1: bulk background removal
magick "$src" -fuzz 22% -transparent white "$tmp"

# Step 2: clamp low-alpha residue
magick "$tmp" -channel A -level 15%,100% +channel "$dest"
```

---

## Key Rule

When making a background transparent in a PNG with soft watercolor or airbrush edges, always use two passes: (1) `-fuzz X% -transparent <color>` for bulk removal, (2) `-channel A -level <low>%,100%` to clamp residual low-alpha pixels without hard-edging the soft regions. Always back up original source files *before* the first destructive transformation, not after.

---

## Files Involved

- `scripts/transparentize-illustrations.ts` — image processing script
- `public/illustrations/*.png` — the six hero illustrations
