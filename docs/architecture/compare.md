# Side-by-side Comparison View — Plain Dharma

*Last updated: 2026-06-27*

Side-by-side reading surface that displays our plain-English translation alongside Bhikkhu Sujato's canonical English translation and the Pāli root text, all pulled from SuttaCentral's bilara API. Sujato + Pāli are paragraph-aligned to each other; our prose flows independently in its own column. Both SuttaCentral sources are CC0 (Mahāsaṅgīti Pāli + Bhikkhu Sujato).

## Overview

```
scripts/fetch-canonical.ts
  → SuttaCentral bilara API (/api/bilarasuttas/{uid}/sujato)
  → packages/content/canonical/{slug}.json  (committed)
    ├─ Pāli root segments (Mahāsaṅgīti Tipiṭaka Buddhavasse 2500)
    ├─ Sujato English segments
    └─ segment ID order array

src/content/canonical.ts
  → getCanonical(slug)      → group segments by paragraph number
  → CanonicalParagraph[]    (rows: id, pali, en)

src/app/[slug]/compare/page.tsx
  → route /[slug]/compare       (statically prerendered)
  → metadata with robots: { index: false } (reference-only, not indexed)

src/views/CompareView.tsx
  → 3-column layout
  ├─ Column 1: Plain Dharma (prose, independent flow)
  ├─ Column 2: Sujato English (paragraph-aligned to Column 3)
  └─ Column 3: Pāli root (lang="pi", italic, paragraph-aligned)
  → renderMarkup() sanitizes <em> and strips <j> + stray tags
```

## Key files

| File | Role |
|---|---|
| `scripts/fetch-canonical.ts` | Fetches Pāli + Sujato from SuttaCentral bilara API; writes committed JSON |
| `packages/content/canonical/*.json` | Six committed documents: segment-aligned text per slug |
| `src/content/canonical.ts` | `getCanonical(slug)` loader: groups segments by paragraph key |
| `src/app/[slug]/compare/page.tsx` | Route `/[slug]/compare`, static params + noindex metadata |
| `src/views/CompareView.tsx` | 3-column layout + renderMarkup helper (sanitizes SuttaCentral markup) |
| `src/components/CanonicalLinks.tsx` | Added "Read side by side" link (en only) as first compare item |
| `packages/content/strings.ts` | Added `canonicalLinks.sideBySide` (en + zh UI copy) |
| `packages/content/package.json` | Added `"./canonical/*"` to exports map |
| `packages/content/canonical-links.ts` | Maps slug → SuttaCentral UID (source of truth) |

## Data flow

1. **Fetch:** `scripts/fetch-canonical.ts` calls SuttaCentral's `/api/bilarasuttas/{uid}/sujato` endpoint
   - Takes `SUTTA_UIDS` mapping from `canonical-links.ts` (slug → UID)
   - Returns bilara format: `root_text`, `translation_text`, `keys_order` (segment IDs)

2. **Store:** Writes `packages/content/canonical/{slug}.json` with flattened structure
   - `order` — segment ID array (document order)
   - `pali` — Record<segmentId, text>
   - `translation` — Record<segmentId, text>
   - Metadata: `uid`, `paliAuthor`, `translationAuthor`, `translationAuthorUid`, `source` URL

3. **Paragraph grouping:** `src/content/canonical.ts#getCanonical` reads JSON and groups segments
   - Segments like `"sn56.11:1.2"` are split on `":"`, then by `"."`
   - Segments with same paragraph prefix (e.g., `"1"`) are joined into one row
   - Group `"0"` is split off as the title
   - Returns `Canonical` type with `title` + `paragraphs: CanonicalParagraph[]`

4. **Render:** `CompareView` displays three columns
   - Column 1: `<Content />` (loaded via `loadSutta("en", slug)`, flows independently)
   - Columns 2 + 3: grid of `canonical.paragraphs`, side-by-side per row
   - Each row has `renderMarkup()` applied to both `en` and `pali` text

## Important patterns and gotchas

**English-only** — No `zh` equivalent. A Pāli ↔ Sujato English alignment exists on
SuttaCentral, but there is no equivalent alignment for Chinese. If a zh translation is
added in future and SuttaCentral bilars a zh alignment, the data fetch and loader are
locale-agnostic and can be reused; the route would need a locale prefix (`/[locale]/[slug]/compare`).

**CC0 attribution required** — Both sources (Mahāsaṅgīti Pāli + Bhikkhu Sujato)
are CC0, but the footer explicitly credits them. Changes to source URLs or author
names must update `CompareView.tsx` footer (lines 110–130).

**Fetch and commit workflow** — Data is committed (`packages/content/canonical/*.json`),
not fetched at runtime, so the site remains static-export compatible. To refresh if
SuttaCentral text changes, re-run manually:

```
node --env-file=.env.local --import tsx scripts/fetch-canonical.ts
```

The script will overwrite existing JSON files. Commit the updated JSONs.

**Exports map** — `packages/content/package.json` must include `"./canonical/*": "./canonical/*"`
or dynamic imports of the JSON files will fail. This is needed even though the JSON is only
imported from web; the exports map is consulted at bundler-time for the package boundary.

**renderMarkup sanitization** — SuttaCentral's segmented text contains minimal inline markup:
- `<em>…</em>` — emphasis, rendered as real `<em>`
- `<j>` — verse line-join marker (unclosed), stripped
- Other stray `<…>` tags are stripped (safety measure)

The regex `/<[^>]+>/g` is the fallback and should catch anything not handled by
the `<em>` parser. Do not parse this as structured HTML — use this specialized
markup handler only.

**Static params and noindex** — The compare route is generated for all `SUTTAS` at
build time (`generateStaticParams`) with `dynamicParams = false`. Metadata sets
`robots: { index: false, follow: true }` so these pages are reference-only and
don't clutter search indexes.

**Navigation cycle** — Compare pages link to the next sutta's compare view, wrapping
to the first at the end. Slug order comes from `SUTTAS` constant in `packages/content/index.ts`.
