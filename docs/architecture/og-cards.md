# Open Graph Cards — Plain Dharma

*Last updated: 2026-05-28*

One social-share card per page. Generated at build time using Satori (`next/og`)
and served alongside canonical URLs so social scrapers pull rich previews with
the teaching's title, Pali name, and illustration. Both locales get localized
cards — English in Garamond Libre, Chinese in a subsetted Noto Serif SC.

## Overview

```
src/lib/og-card.tsx
  → renderOgCard({ eyebrow, title, tagline?, illustrationDataUrl, cjk? })
  → uses Satori (next/og ImageResponse)
  → 1200x630 PNG; cjk:true also loads Noto Serif SC for Chinese glyphs

EN  src/app/opengraph-image.tsx            (site default)
    src/app/read/opengraph-image.tsx       (long-form reading page)
    src/app/about/opengraph-image.tsx      (about)
    src/app/glossary/opengraph-image.tsx   (glossary)
    src/app/download/opengraph-image.tsx   (downloads)
    src/app/[slug]/opengraph-image.tsx     (per-sutta, dynamic)

ZH  src/app/zh/opengraph-image.tsx         (zh default; cascades to /zh/contribute)
    src/app/zh/read/opengraph-image.tsx
    src/app/zh/about/opengraph-image.tsx
    src/app/zh/glossary/opengraph-image.tsx
    src/app/zh/[slug]/opengraph-image.tsx  (per-sutta, dynamic, cjk)

src/lib/og-meta.ts
  → ogBase(locale) → shared { siteName, locale } spread into every page's openGraph
  → SITE_NAME / SITE_URL / SITE_DESCRIPTION constants (also used by layout.tsx)

src/app/layout.tsx
  → sets metadataBase: new URL(SITE_URL)
  → exports default metadata { openGraph, twitter }; pages spread ogBase(locale)
```

## Key files

| File | Role |
|---|---|
| `src/lib/og-card.tsx` | Shared renderer; caches Garamond + CJK font Promises in module scope; `cjk` flag toggles the Noto Serif SC fallback |
| `src/lib/og-meta.ts` | `ogBase(locale)` + site constants — keeps `og:site_name`/`og:locale` on every page (see shallow-merge gotcha) |
| `src/app/opengraph-image.tsx` | Site default — sun illustration from first-talk |
| `src/app/[slug]/opengraph-image.tsx` | Dynamic per-sutta (EN) — eyebrow = Pali name, illustration = sutta's own |
| `src/app/zh/**/opengraph-image.tsx` | ZH counterparts; per-sutta eyebrow = `kicker_override` (e.g. 转法轮经), all pass `cjk: true` |
| `src/app/layout.tsx` | Sets `metadataBase`; default metadata + `ogBase("en")` |
| `src/app/fonts/GaramondLibre-*.otf` | Garamond Libre (Regular, Italic, Bold) — Latin card text |
| `src/app/fonts/NotoSerifSC-OG-700.ttf` | ~62KB subsetted CJK font for ZH cards (generated, committed) |
| `scripts/generate-og-fonts.ts` | `pnpm generate-og-fonts` — rebuilds the CJK subset from ZH content/routes |

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

When `cjk: true`, the font stack becomes `Garamond Libre, 'Noto Serif SC', serif`
so Latin (eyebrow Pali name, footer) renders in Garamond and Chinese falls
through to Noto Serif SC. ZH cards skip the italic tagline — the subset is bold
(700) only, and CJK has no real italic.

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

**Satori has no system fonts → CJK renders as tofu.** Garamond Libre is Latin-only,
so Chinese cards must ship a CJK font or every glyph is an empty box. A full CJK
font is ~10MB, so `scripts/generate-og-fonts.ts` scans the ZH content registry +
ZH OG routes for the exact glyphs used and fetches a TrueType subset from Google
Fonts (it forces TTF via a browserless UA — Satori can't decode woff2). **Re-run
`pnpm generate-og-fonts` whenever ZH card copy or a ZH sutta title/`kicker_override`
changes**, or new glyphs render as tofu.

**openGraph is shallow-merged, not deep-merged.** When a page declares its own
`openGraph`, it *replaces* the layout's entirely — only the file-based `og:image`
survives (separate, higher priority). So `og:site_name`/`og:locale` vanish unless
re-declared. Every page spreads `ogBase(locale)` from `src/lib/og-meta.ts` into its
`openGraph` to keep those present (and to emit `zh_CN` vs `en_US` correctly).

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
// src/app/[slug]/opengraph-image.tsx (EN)
const meta = getMeta("en", slug)
const illustrationDataUrl = await publicImageDataUrl(`/illustrations/${slug}.png`)

return renderOgCard({
  eyebrow: meta.pali_name,        // Latin Pali name (Garamond)
  title: meta.title,              // with embedded \n for line breaks
  illustrationDataUrl,
})

// src/app/zh/[slug]/opengraph-image.tsx — same shape, locale "zh":
//   eyebrow: meta.kicker_override ?? meta.pali_name   // e.g. 转法轮经
//   cjk: true
```

The dynamic route produces cards at `/[slug]/opengraph-image/card` (and the
`/zh/...` mirror) that social scrapers fetch when users share the page URL.
