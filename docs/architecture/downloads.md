# Downloads & Distribution — Plain Dharma

*Last updated: 2026-05-30*

## Overview

Download artifacts (EPUB, PDF, audiobook, cover image) and print-ready packages (KDP paperback, print PDFs) are built on-demand via separate scripts. Reader-facing downloads are automatically published to `public/downloads/` as the final step of each generator; print and internal artifacts stay in `dist/`. All files are served at `/downloads/*` as part of the static site.

The donation flow is honor-system — anyone who guesses the URL can download without paying. The site nudges with the donation page; it doesn't gate access.

## Build pipeline & artifact families

Three parallel pipelines feed from the same MDX sources but target different mediums:

1. **Reader downloads** — EPUB, screen PDF (6×9), audiobook, cover art. Published to `public/downloads/`, served over HTTP.
2. **Print PDFs** — two variants (color and B&W) at 5.25×8.25 (5×8 trim + 0.125" bleed). Cover-inclusive proofs. Stay in `dist/print/`.
3. **KDP paperback** — interior PDFs (cover-free, 6×9 + 0.125" bleed) and computed wraparound covers (spine width = page count × paper caliper). Both color and B&W. Stay in `dist/kdp/`.

All share the same book markdown source and per-variant illustration caches, differing only in trim size, bleed, page color, and content inclusions (cover on/off).

### Publishing architecture

**Each reader-facing build script publishes its own output** via the `publishToDownloads()` helper in `scripts/lib/publish.ts`. Publishing is tied to generation, so the files served at `/downloads/*` are always the ones you just built.

```
generate-cover.ts
  → dist/ebook/cover.jpg
  → publishToDownloads(cover, "plain-dharma-cover.jpg")
  → public/downloads/plain-dharma-cover.jpg

generate-back-cover.ts
  → dist/ebook/back-cover.jpg (screen trim, 6×9)
  → publishToDownloads(backCover, "plain-dharma-back-cover.jpg")
  → public/downloads/plain-dharma-back-cover.jpg

build-pdf.ts
  → dist/pdf/plain-dharma.pdf
  → publishToDownloads(outPdf, "plain-dharma.pdf")
  → public/downloads/plain-dharma.pdf

build-ebook.ts
  → dist/ebook/plain-dharma.epub
  → publishToDownloads(outEpub, "plain-dharma.epub")
  → public/downloads/plain-dharma.epub

build-audiobook.ts
  → dist/audiobook/plain-dharma.m4b
  → publishToDownloads(outPath, "plain-dharma.m4b")
  → public/downloads/plain-dharma.m4b
```

Non-published artifacts (print, KDP, storyboard) remain in `dist/` for proofing and archival.

## Key files

| File | Role |
|---|---|
| `scripts/lib/publish.ts` | The `publishToDownloads(srcAbs, destName)` helper that copies a built artifact into `public/downloads/` and logs the size. No-ops with a warning if the source is missing (safe for optional artifacts). |
| `scripts/lib/book-source.ts` | Shared book markdown builder, called by all PDF/EPUB/KDP variants. Contains `buildBookMarkdown`, `buildMetadataYaml`, `generateQrCode`. |
| `scripts/generate-cover.ts` | Rasterize InDesign cover PDF (6×9", CMYK) to 1600×2400 JPEG (sRGB) via pdftoppm + ImageMagick; publish as final step. |
| `scripts/generate-back-cover.ts` | Generate back cover(s) from parameterized XeLaTeX template. Two trims: screen 6×9 (published), print 5.25×8.25 + grayscale variant (internal only). Outputs shared with front cover file for dimension consistency. |
| `scripts/templates/back-cover.tex` | Parameterized back cover source (Garamond Libre, brand palette, gold stitched stripe on spine). Tokens: `__FONTSIZE__`, `__PAPER_W__`, `__PAPER_H__`, `__STRIPE_W__`, `__STITCH_X__`, etc. Two runs per target for TikZ current-page node. |
| `scripts/templates/pdf-back-cover.tex` | Appends back cover to screen PDF via `\AtEndDocument` — xelatex only. |
| `scripts/build-pdf.ts` | Build screen PDF (6×9" + 0.125" bleed, xelatex, cream background) from book markdown; append back cover as final page; publish as final step. |
| `scripts/build-ebook.ts` | Build EPUB from MDX sources via pandoc; append back cover image as full-width final page; publish as final step. |
| `scripts/build-audiobook.ts` | Stitch per-sutta MP3 manifests into single M4B with chapter markers; publish as final step. |
| `scripts/build-print-pdf.ts` | Build two print variants (color on white, B&W on cream) at 5.25×8.25 (5×8 trim + 0.125" bleed). Each appends its print-trim back cover as final page. Non-published. |
| `scripts/build-kdp.ts` | Build KDP paperback packages: cover-free interiors (bw/color at 6×9 + 0.125" bleed) and computed wraparound covers. Spine width = page count × paper caliper (color: white 0.002252in, B&W: cream 0.0025in per page). Always full-color covers. |
| `scripts/templates/kdp-wrap-cover.tex` | Parameterized KDP wraparound cover (TikZ, gold spine stripe). Tokens: `__PAPER_W__`, `__PAPER_H__`, `__SPINE_W__`, `__BACK_IMG__`, `__FRONT_IMG__`. Two runs for current-page node. |
| `scripts/build-storyboard.ts` | Render 40-page screen PDF to a "tall format" picture-book storyboard PNG + PDF. Page 1 single (cover), spreads 2–3…38–39, page 40 single (back). Pure ImageMagick + pdftoppm. Planning tool, not published. |
| `scripts/build-manifest.ts` | Write `dist/MANIFEST.md` — human-readable index of all artifacts with sizes/mtimes grouped by category, recent content commits, and repo changelog. Final step of `pnpm build-all`. |
| `scripts/publish-downloads.ts` | Batch convenience: republish all reader-facing artifacts at once from current `dist/` contents. Used when re-syncing artifacts (e.g. after fresh checkout with committed dist/ files). Missing sources are skipped. |
| `scripts/assets/PlainDharma_Cover.pdf` | Designer's InDesign cover (source of truth for cover.jpg). Rendered at 320 DPI and downscaled by `generate-cover.ts`. |

## Data flow

### Reader-facing downloads

1. **Cover generation** — run `pnpm generate-cover` and `pnpm generate-back-cover` first (or include them in `pnpm build-all`). These produce the shared front + back cover JPEGs in `dist/ebook/` for all downstream formats.
2. **Format generation** — run `pnpm build-pdf`, `pnpm build-ebook`, `pnpm build-audiobook` on-demand. Each reads the shared cover(s) and book markdown, then generates its format-specific output in `dist/{format}/`.
3. **Publish phase** — each script's final step calls `publishToDownloads()`, which:
   - Checks if the source exists (skips with a warning if not).
   - Creates `public/downloads/` if missing.
   - Copies the artifact.
   - Logs the filename and size in KB.
4. **Serve phase** — `public/downloads/` is static-served from the site at `/downloads/*`. No special routing or authentication.

### Print packages

1. **Back cover generation** — `pnpm generate-back-cover` produces both screen (published) and print-trim variants in `dist/ebook/` as a byproduct.
2. **Print PDF variants** — `pnpm build-print-pdf` generates color and B&W versions at 5.25×8.25, each appending its print-trim back cover. Stay in `dist/print/`.
3. **KDP package** — `pnpm build-kdp` generates cover-free interiors (bw/color) and computed wraparound covers (spine width per variant). Stay in `dist/kdp/`.
4. **Manifest** — `pnpm build-manifest` writes `dist/MANIFEST.md` with all artifacts indexed by category.

### Batch: build everything

`pnpm build-all` runs the full pipeline in order:
```
pnpm generate-cover &&
pnpm generate-back-cover &&
pnpm build-pdf &&
pnpm build-ebook &&
pnpm build-print-pdf &&
pnpm build-kdp &&
pnpm build-storyboard &&
pnpm build-manifest
```

## Important patterns

**Publishing is automatic** — if you run `pnpm build-ebook`, the EPUB is both built in `dist/ebook/` *and* published to `public/downloads/` in a single command. You never have to remember a separate publish step.

**`scripts/publish-downloads.ts` is a batch convenience** — normally, each generator publishes its own output. But if you have fresh artifacts in `dist/` (e.g. from a fresh clone or a CI build) and want to re-sync them all at once, `pnpm publish-downloads` does that. Missing sources are skipped — the script doesn't error if the audiobook isn't ready yet.

**Front and back covers are shared** — `generate-cover.ts` rasterizes the designer's InDesign cover PDF to 1600×2400 JPEG (6×9"). `generate-back-cover.ts` generates the back cover at the same resolution using a parameterized XeLaTeX template. Both are read by all downstream formats (screen PDF, EPUB, audiobook) and print packages (print PDFs, KDP). This ensures dimensional consistency across all outputs.

**Back cover stitch dash pattern is measured to match the front cover** — the gold stitched stripe on the back cover uses the same 1pt stroke with 3.5pt-on / 3.2pt-off dashes as the front cover (generated cover PDF). This is critical for a seamless wraparound appearance on the KDP covers.

**Cover design credit** — "Cover design by Alex Miller and Ellen Shapiro" appears in three places:
- **Book colophon** (`scripts/lib/book-source.ts` buildBookMarkdown, "About This Book" section) — in all formats (EPUB, PDF, KDP).
- **EPUB metadata** (`scripts/build-ebook.ts` buildMetadataYaml) — dc:contributor with role `cov` (Dublin Core standard for cover contributors).
- **Website About page** (`packages/content/strings.ts` about.pCoverCredit, rendered in `src/views/AboutView.tsx`) — visible in en and zh locales.

**Illustrations are format-specific** — each builder resizes + recompresses the source PNGs differently:
- **EPUB** → 800px JPEG, q=85 on cream (Kindle target, ~50 KB per image).
- **Screen PDF** → 1000px JPEG, q=85 on cream.
- **Print PDFs** → 1200px JPEG, q=92 (B&W: grayscale, color: full sRGB) on respective backgrounds.
- **KDP** → 1200px JPEG, q=88 on white (color interior) or cream (B&W interior).
- **Audiobook** → no illustrations (audio-only, cover image only).

These are cached independently in `dist/{format}/images/`, so regenerating one doesn't rebuild the others.

**KDP covers are always full color, but spine width varies per interior variant** — KDP requires covers to be color; the back cover (gold stripe) and wraparound mechanism are shared. What differs is the spine width, computed from the interior's page count × the paper's caliper (0.002252" per page for white stock, 0.0025" for cream). Run `pnpm build-kdp` AFTER its interior is finalized; spine width is baked into the computed wrap dimensions.

## Commands

| Command | Output | Publishes to |
|---|---|---|
| `pnpm generate-cover` | `dist/ebook/cover.jpg` (1600×2400, 6×9") | `/downloads/plain-dharma-cover.jpg` |
| `pnpm generate-back-cover` | `dist/ebook/back-cover.jpg` (screen trim); `back-cover-print-{color,bw}.jpg` (print trim, internal only) | `/downloads/plain-dharma-back-cover.jpg` (screen only) |
| `pnpm build-pdf` | `dist/pdf/plain-dharma.pdf` (40 pages, 6×9 + bleed, back cover final page) | `/downloads/plain-dharma.pdf` |
| `pnpm build-ebook` | `dist/ebook/plain-dharma.epub` (back cover final page) | `/downloads/plain-dharma.epub` |
| `pnpm build-audiobook` | `dist/audiobook/plain-dharma.m4b` (with chapter markers) | `/downloads/plain-dharma.m4b` |
| `pnpm build-print-pdf` | `dist/print/{color,bw}/plain-dharma-print-{color,bw}.pdf` (5.25×8.25 + bleed, back cover final page) | — |
| `pnpm build-kdp` | `dist/kdp/plain-dharma-kdp-interior-{bw,color}.pdf`, `plain-dharma-kdp-cover-{bw,color}.pdf` (cover-free interiors + computed wraparound covers) | — |
| `pnpm build-storyboard` | `dist/storyboard/plain-dharma-storyboard.{png,pdf}` (40-page visual map, page-1 single / spreads / page-40 single) | — |
| `pnpm build-manifest` | `dist/MANIFEST.md` (indexed artifacts, content commits, changelog) | — |
| `pnpm build-all` | (all of the above, in order) | reader-facing artifacts |
| `pnpm publish-downloads` | (batch republish from `dist/`) | all published artifacts |

## Shared content source & build flow

All text-based formats and print packages read from the same canonical MDX sources in `packages/content/{locale}/`. See `docs/architecture/content-pipeline.md` for the full data flow. A typo fix in one MDX file updates the EPUB, screen PDF, print PDFs, KDP interiors, and audiobook simultaneously.

The audiobook *narration* (MP3 files) is generated separately by `scripts/generate-audio.ts` from source text in `src/content/{en,zh}_tts/`, intentionally distinct from the reading MDX.

## Gotchas

- **pdftoppm `-scale-to` vs `-scale-to-y`**: `build-storyboard.ts` uses `-scale-to PH` (scales the larger dimension, preserving aspect ratio). `-scale-to-y` would fix the height but leave width at default DPI, squishing portrait pages. This matters for 6×9 pages where height is the constraint.

- **Back cover stitch pattern is hand-measured**: The gold stitched stripe on the back cover uses 3.5pt-on / 3.2pt-off dashes (1pt stroke, same as the front cover). These values were tuned to match the front cover's appearance on the 6×9 trim. Changing stripe width or page size requires re-tuning the dash pattern.

- **KDP spine width is baked into the cover PDF**: Once `build-kdp` generates the wraparound cover, the spine width is fixed in that PDF. If the interior page count changes (e.g. because of a content edit), the spine width will be wrong — re-run `pnpm build-kdp` to recompute.

- **Two XeLaTeX passes required for back cover and KDP covers**: TikZ's `current page` node (used for the gold stripe and spine positioning) is only available on the second pass. Both `generate-back-cover.ts` and `build-kdp.ts` run xelatex twice per template.

- **KDP covers are always full-color rasterized**: Even though the interior comes in B&W and color variants, the KDP covers themselves are full-color PDFs (KDP prints covers in color). The B&W/color distinction is in the *interior* (which pages are printed in color vs grayscale), not the cover. The wraparound cover templates are parameterized only by spine width, not by color variant (both color and B&W covers would look identical if printed, but we generate them separately because spine width differs per interior page count).
