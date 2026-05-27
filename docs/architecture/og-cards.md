# Open Graph Cards — Plain Dharma

*Last updated: 2026-05-27*

One social-share card per page. Generated at build time using Satori (`next/og`)
and served alongside canonical URLs so social scrapers pull rich previews with
the teaching's title, Pali name, and illustration.

## Overview

```
src/lib/og-card.tsx
  → renderOgCard({ eyebrow, title, tagline?, illustrationDataUrl })
  → uses Satori (next/og ImageResponse)
  → 1200x630 PNG

src/app/opengraph-image.tsx              (site default)
src/app/read/opengraph-image.tsx         (long-form reading page)
src/app/about/opengraph-image.tsx        (about)
src/app/glossary/opengraph-image.tsx     (glossary)
src/app/download/opengraph-image.tsx     (downloads)
src/app/[slug]/opengraph-image.tsx       (per-sutta, dynamic)

src/app/layout.tsx
  → sets metadataBase: new URL("https://plaindharma.com")
  → exports per-page metadata { openGraph, twitter }
```

## Key files

| File | Role |
|---|---|
| `src/lib/og-card.tsx` | Shared renderer; caches font Promises in module scope |
| `src/app/opengraph-image.tsx` | Site default — sun illustration from first-talk |
| `src/app/[slug]/opengraph-image.tsx` | Dynamic per-sutta — eyebrow = Pali name, illustration = sutta's own |
| `src/app/layout.tsx` | Sets `metadataBase`; per-page metadata exports set og:title/description/url |
| `src/app/fonts/` | Garamond Libre (Regular, Italic, Bold) — loaded by og-card.tsx |

## Card layout

Fixed 1200×630 PNG. Left column holds text; right 470px is illustration (410×410 centered).

- **Top rule:** 8px saffron (#C7651C)
- **Eyebrow:** 38px uppercase Garamond Italic, saffron, left-aligned (e.g., "Dhammacakkappavattana")
- **Title:** 92px bold Garamond, ink (#1F1812), wraps on `\n` (pass title with line breaks to fit)
- **Tagline** (optional): 44px italic Garamond, ink, below title
- **Footer:** "plaindharma.com" in 32px saffron, bottom-left
- **Illustration:** 410×410 square, inlined as base64 data URL (Satori can't fetch from dev server)

Palette hardcoded in JSX:
- PAPER `#f5efe0`, INK `#1f1812`, ACCENT `#c7651c`, DIVIDER `#e0d4b8`

## Generation

Build time only. `generateStaticParams` in `src/app/[slug]/opengraph-image.tsx` mirrors `SUTTAS` registry to produce static routes for all six teachings.

Each file exports:
- `generateStaticParams()` (dynamic routes only) — returns `[{ slug }]` for all six suttas
- `generateImageMetadata(props)` — async, returns `{ id, contentType, alt }`
- Default export `OgImage(props)` — component that returns `ImageResponse`

Both `params` and route handlers are `Promise<...>` in Next.js 16 — must be awaited.

## Important gotchas

**Fonts cached in module scope.** `src/lib/og-card.tsx` reads Garamond OTF files
via `fs.promises.readFile` once at module initialization and caches them. Re-runs
use the cached Promise, avoiding repeated I/O.

**Satori reads no CSS.** Colors and fonts are explicit JSX props, not Tailwind
utilities or CSS variables. The palette is hardcoded in `renderOgCard()`.

**Images must be data URLs.** Satori can't fetch from the dev server or
external URLs during build. Use `publicImageDataUrl(path)` to inline local
illustrations as base64.

**`params` is Promise.** Unlike page components, OG image routes receive
`params: Promise<{ slug: string }>` in Next.js 16. Always `await params.slug`.

**File-based convention auto-wires og:image.** If `metadata.openGraph.images` is
set anywhere in the page metadata export, it *overrides* the file-based card.
Leave `images` unset on per-page exports; the framework auto-populates both
`og:image` and `twitter:image` from the file.

**`metadataBase` is load-bearing.** Without `metadataBase: new URL("https://plaindharma.com")`
in the root layout, relative URLs in OG tags will not resolve correctly in social scrapers.

## Per-sutta card example

```tsx
// src/app/[slug]/opengraph-image.tsx
const meta = await getMeta(slug)
const illustrationUrl = publicImageDataUrl(`/illustrations/${slug}.png`)

return renderOgCard({
  eyebrow: meta.pali_name,        // no ordinal prefix
  title: meta.title,               // with embedded \n for line breaks
  illustrationDataUrl: illustrationUrl
})
```

The dynamic route produces cards at `/[slug]/opengraph-image/card` that social
scrapers fetch when users share `plaindharma.com/[slug]`.
