# Downloads & Distribution — Plain Dharma

*Last updated: 2026-05-29*

## Overview

Download artifacts (EPUB, PDF, audiobook, cover image) are built on-demand via separate scripts and automatically published to `public/downloads/` as the final step of each generator. The files are served at `/downloads/*` as part of the static site.

This is intentional — the donation flow is honor-system. Anyone who guesses the URL can download without paying. The site nudges with the donation page; it doesn't gate access.

## Publishing architecture

**Each build script publishes its own output** via the `publishToDownloads()` helper in `scripts/lib/publish.ts`. Publishing is tied to generation, so the files served at `/downloads/*` are always the ones you just built.

```
build-ebook.ts
  → dist/ebook/plain-dharma.epub
  → publishToDownloads(outEpub, "plain-dharma.epub")
  → public/downloads/plain-dharma.epub (served at /downloads/plain-dharma.epub)

build-pdf.ts
  → dist/pdf/plain-dharma.pdf
  → publishToDownloads(outPdf, "plain-dharma.pdf")
  → public/downloads/plain-dharma.pdf

build-audiobook.ts
  → dist/audiobook/plain-dharma.m4b
  → publishToDownloads(outPath, "plain-dharma.m4b")
  → public/downloads/plain-dharma.m4b

generate-cover.ts
  → dist/ebook/cover.jpg (also used by PDF and audiobook)
  → publishToDownloads(cover, "plain-dharma-cover.jpg")
  → public/downloads/plain-dharma-cover.jpg
```

## Key files

| File | Role |
|---|---|
| `scripts/lib/publish.ts` | The `publishToDownloads(srcAbs, destName)` helper that copies a built artifact into `public/downloads/` and logs the size. No-ops with a warning if the source is missing (safe for optional artifacts). |
| `scripts/build-ebook.ts` | Build EPUB from MDX sources via pandoc; publish as final step. |
| `scripts/build-pdf.ts` | Build screen PDF (6×9 inch, xelatex) from shared book markdown; publish as final step. |
| `scripts/build-audiobook.ts` | Stitch per-sutta MP3 manifests into single M4B with chapter markers; publish as final step. |
| `scripts/generate-cover.ts` | Rasterize cover image via Chromium; publish as final step. |
| `scripts/publish-downloads.ts` | Batch convenience: republish all four at once from current `dist/` contents. Used only when re-syncing artifacts from elsewhere (e.g. after a fresh checkout with committed dist/ files). Missing sources are skipped — e.g. an incomplete audiobook won't block republishing the EPUB/PDF. |

## Data flow

1. **Generate phase** — run `pnpm build-ebook`, `pnpm build-pdf`, `pnpm build-audiobook`, or `pnpm generate-cover` on-demand.
2. **Publish phase** — each script's final step calls `publishToDownloads()`, which:
   - Checks if the source exists (skips with a warning if not).
   - Creates `public/downloads/` if missing.
   - Copies the artifact.
   - Logs the filename and size in KB.
3. **Serve phase** — `public/downloads/` is static-served from the site at `/downloads/*`. No special routing or authentication.

## Important patterns

**Publishing is automatic** — if you run `pnpm build-ebook`, the EPUB is both built in `dist/ebook/` *and* published to `public/downloads/` in a single command. You never have to remember a separate publish step.

**`scripts/publish-downloads.ts` is a batch convenience** — normally, each generator publishes its own output. But if you have fresh artifacts in `dist/` (e.g. from a fresh clone or a CI build) and want to re-sync them all at once, `pnpm publish-downloads` does that. Missing sources are skipped — the script doesn't error if the audiobook isn't ready yet.

**Cover is shared** — `generate-cover.ts` rasterizes the cover once and saves it to `dist/ebook/cover.jpg`. Both `build-pdf.ts` and `build-audiobook.ts` read from that same file, so regenerating the cover updates all three formats. A missing cover is non-fatal — the EPUB, PDF, and audiobook all build successfully without one, just with a `console.warn`.

**Illustrations are format-specific** — each builder resizes + recompresses the source PNGs differently:
- **EPUB** → 800px JPEG, q=85 on cream (Kindle target, ~50 KB per image).
- **PDF** → 1000px JPEG, q=85 on cream (screen PDF, ~50 KB per image).
- **Audiobook** → no illustrations (audio-only, cover image only).

These are cached independently in `dist/{format}/images/`, so regenerating one doesn't rebuild the others.

## Commands

| Command | Output | Publishes to |
|---|---|---|
| `pnpm build-ebook` | `dist/ebook/plain-dharma.epub` | `/downloads/plain-dharma.epub` |
| `pnpm build-pdf` | `dist/pdf/plain-dharma.pdf` | `/downloads/plain-dharma.pdf` |
| `pnpm build-audiobook` | `dist/audiobook/plain-dharma.m4b` | `/downloads/plain-dharma.m4b` |
| `pnpm generate-cover` | `dist/ebook/cover.jpg` | `/downloads/plain-dharma-cover.jpg` |
| `pnpm publish-downloads` | (batch republish from `dist/`) | all four at once |

## Shared content source

All three text-based formats (EPUB, PDF, audiobook cover) read from the same canonical MDX sources in `packages/content/{locale}/`. See `docs/architecture/content-pipeline.md` for the full data flow. A typo fix in one MDX file updates the EPUB, PDF, and audiobook simultaneously.

The audiobook *narration* (MP3 files) is generated separately by `scripts/generate-audio.ts` from source text in `src/content/{en,zh}_tts/`, intentionally distinct from the reading MDX.
