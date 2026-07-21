# Handoff — HTML front cover pipeline

Status as of this branch (`chore/credit-claude-translator`). Pick up here on the workstation.

## What's done

The LaTeX front cover is being replaced by an **HTML → headless-Chrome → print JPG** pipeline so there's a single, WYSIWYG source of truth.

- **`book/front-cover.html`** — the canonical cover. Self-contained: inline `@font-face` (Garamond Libre body serif + Geist UI sans, copied into `book/fonts/`), local sun art at `book/assets/cover-sun.png`. Authored at 1600×2400 CSS px = 6×9 trim.
  - Subtitle is **LOCKED**: *"The Buddha's Foundational Teachings / in Modern English"*. Never "root teachings" — that import phrasing was explicitly rejected.
  - Gold spine band on the left with a brighter-red dotted **stitch** (`--cover-thread: #C8331A`) sewn *over* the band (inset ~16px from its right edge).
  - Sun enlarged to 1080px and raised (`.scene margin-top: 90px`).
  - Byline: "Translated by Claude / Edited by Alex Miller / A dharma gift · plaindharma.com".
- **`book/assets/cover-sun.png`** — original sun art (`scripts/assets/cover-artwork.png`) with the cream background luma-faded to transparent. **No saturation/brightness change** — keep it that way.
- **`scripts/render-front-cover.ts`** + `pnpm render-front-cover` — screenshots the stage in headless Chrome at 2× (3200×4800 ≈ 533dpi), crops `.cover`, writes to `dist/ebook/`:
  - `front-cover-6x9-color.png` (lossless master)
  - `front-cover-print-color.jpg` (sRGB, for build-kdp's wraparound)
  - `front-cover-print-bw.jpg` (grayscale)
- `scripts/templates/front-cover.tex` subtitle was reverted to the locked wording (kept in sync until LaTeX is fully retired).

## How to render

```
pnpm render-front-cover     # needs Google Chrome + ImageMagick (magick)
open dist/ebook/front-cover-print-color.jpg
```

Chrome path is auto-detected; override with `CHROME=/path/to/chrome`.

## Remaining follow-ups (not started)

1. **Square audiobook cover** — build `book/audiobook-cover.html` (no spine band) + a render path, so we can retire `scripts/generate-front-cover.ts` (still owns `audiobook-cover.jpg`, consumed by `build-audiobook.ts`).
2. **Retarget build-kdp to 6×9** — `scripts/build-kdp.ts` wraparound + spine math and the back cover (`scripts/templates/back-cover.tex` / `generate-back-cover.ts`) are still wired for 5×8. Move to 6×9 + bleed before the new front can drop into the wraparound.
3. **Rewire `build-all` / package.json** to use the HTML renderer once square + wraparound are ported, then delete `front-cover.tex` and the old `generate-front-cover.ts`.

## Gotchas

- The `@media print` block in the HTML is only a sketch (the 232px title would overflow a true-inch page) — fidelity lives in the fixed-px 1600×2400 raster, so we rasterize via Chrome rather than print-to-PDF.
- Don't reapply saturation flattening to the sun.
- Keep the locked subtitle wording on every cover surface.
