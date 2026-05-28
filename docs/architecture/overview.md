# Architecture — Plain Dharma

*Last updated: 2026-05-28*

## Detailed docs

| Topic | File |
|---|---|
| Content pipeline (MDX, SUTTAS registry, loaders) | [content-pipeline.md](content-pipeline.md) |
| Internationalization (i18n routing, registry, locales) | [i18n.md](i18n.md) |
| Design system (palette, typography, Wash, NightSky) | [design-system.md](design-system.md) |
| Illustrations (Gemini generation, transparency pipeline) | [illustrations.md](illustrations.md) |
| Audio playback (TTS pipeline, manifests, player) | [audio.md](audio.md) |
| Dev workflow (ngrok tunnel, QR code, scripts) | [dev-workflow.md](dev-workflow.md) |
| Deployment (Vercel, DNS, routing) | [deployment.md](deployment.md) |
| Mobile app (React Native / Expo monorepo) | [mobile.md](mobile.md) |
| Sitemap and URL structure | [../sitemap.md](../sitemap.md) |

The stack, the conventions, and the *why* behind each decision. This is a reading-first static site. Every choice below serves that.

## Monorepo (web + mobile)

This is a pnpm workspace. The Next.js web app currently lives at the repo root; a React Native (Expo) app lives in `apps/mobile`, and both share the sutta content via `packages/content` (registry, strings, drops, glossary, audio types + the canonical `.mdx`). `pnpm-workspace.yaml` uses `nodeLinker: hoisted` (required for React Native under pnpm — workspace-wide, so the web installs hoisted too). The web has **not** been physically moved to `apps/web/` yet; that restructure is deferred. See [mobile.md](mobile.md).

## Stack

| Layer            | Choice                                | Why                                                                                                  |
| ---------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Framework        | Next.js 15 (App Router)               | Static generation for instant load, built-in i18n primitives, Vercel-native, mature ecosystem        |
| Language         | TypeScript                            | Type safety on a small surface area is cheap insurance                                               |
| Styling          | Tailwind CSS                          | Utility-first, no runtime, plays well with `prose`                                                   |
| Component system | shadcn/ui                             | Design system foundation — minimal use expected (reading site, mostly typography)                    |
| Typography       | `@tailwindcss/typography` (`prose`)   | Drop-in beautiful prose styling for the reading pages                                                |
| Fonts            | Garamond Libre (local OTF) + Geist (Vercel package) | Garamond Libre for body and headings (classical serif carrying the ancient content); Geist for UI — nav, footer, buttons, meta labels, TOC (modern sans as the contemporary wrapper). *Framing: new book with old content. Garamond carries the ancient content; Geist carries the contemporary wrapper. The tension is intentional.* |
| Content          | MDX per teaching, per locale          | Single source of truth at `src/content/{locale}/{slug}.mdx`; every surface composes from these       |
| Package manager  | pnpm                                  | Fast, disk-efficient, deterministic                                                                  |
| Deployment       | Vercel                                | Zero-config Next.js, edge CDN, free tier covers this project comfortably; static export also viable  |

### Bootstrapping

Scaffold with `create-next-app`. After scaffold: install `@tailwindcss/typography`, initialize shadcn/ui (`pnpm dlx shadcn@latest init`), drop Garamond Libre OTFs into `src/app/fonts/` and load via `next/font/local`, install the `geist` package and import `GeistSans` from `geist/font/sans`.

## Design intent

- **Reading-first.** No hero imagery, no carousels, no animations. The page is the text.
- **Generous line-height** — target ~1.7 for body. Reading these teachings should feel slow.
- **Max measure ~65–70ch.** Long lines kill long-form reading.
- **Warm off-white background.** Pure white is harsh; a faint warm tint reduces eye strain and signals "book," not "app." See palette table below.
- **Minimal ornament.** Section breaks are space and a single rule, not decorative dividers.
- **No dark mode at launch** unless trivially free via shadcn defaults. Don't optimize for it; this is a daytime contemplative reading site.
- **Mobile-first**, but desktop should feel like a book — not a stretched mobile view.

### Palette

Locked. Driven by CSS variables in `src/app/globals.css` under `@theme inline { ... }` so Tailwind utilities resolve directly from these tokens.

| Token              | Hex       | Utility class          | Use                                            |
| ------------------ | --------- | ---------------------- | ---------------------------------------------- |
| `--color-paper`    | `#F5EFE0` | `bg-paper`             | Background (cream)                             |
| `--color-ink`      | `#1F1812` | `text-ink`             | Body text (deep warm near-black)               |
| `--color-accent`   | `#C7651C` | `text-accent` / `bg-accent` | Monkish saffron — logo, headings, CTAs    |
| `--color-link`     | `#8B3A0F` | `text-link`            | Deep saffron — hover, emphasis                 |
| `--color-divider`  | `#E0D4B8` | `border-divider`       | Soft tan dividers                              |

## Content architecture — **Decided 2026-05-25**

Single source of truth per `(teaching × locale)`. Every surface — per-teaching pages, the `/read` long-form view, the home index, downloads, and og:images — composes from these MDX files. Nothing else stores the text.

### Layout

```
src/content/
├── en/
│   ├── first-talk.mdx
│   ├── not-self.mdx
│   ├── fire-sermon.mdx
│   ├── loving-kindness.mdx
│   ├── mindfulness.mdx
│   └── how-to-decide.mdx
├── th/
│   ├── first-talk.mdx          ← Thai translation when ready
│   └── ...
├── cn/
│   └── ...
└── index.ts                    ← canonical order + helpers
```

### Frontmatter convention (per file)

```mdx
---
slug: first-talk
title: The Buddha's First Talk
subtitle: Setting the Wheel in Motion (Dhammacakkappavattana)
ordinal: 1
---

The Buddha was staying near Varanasi...
```

### Composition rule

Every surface imports from these files; nothing else stores the text.

| Surface | How it composes |
|---|---|
| `/[locale]/first-talk` | Renders `content/{locale}/first-talk.mdx` |
| `/[locale]/read` | Imports all six MDX modules in `ordinal` order, renders them with separators |
| `/[locale]` home | Reads frontmatter only, lists titles + subtitles |
| PDF / ePub downloads | Build script reads same markdown files, concatenates, pipes through pandoc → `public/downloads/` |
| og:image per teaching | Reads `title` + `subtitle` from frontmatter |

### Canonical index

`src/content/index.ts` is the **only** place that knows the canonical order:

```ts
export const SUTTAS = [
  'first-talk', 'not-self', 'fire-sermon',
  'loving-kindness', 'mindfulness', 'how-to-decide'
] as const
```

### Translation flow

A Thai translator drops `src/content/th/first-talk.mdx` into the repo. `/th/first-talk` lights up automatically — no code changes, no config edits.

A helper `getAvailableLocales(slug: string): Promise<string[]>` scans the filesystem at build time and powers a "Read in another language" widget at the bottom of each page, listing only the locales that actually have a translation for that specific sutta.

### `combined-suttas.md` is now a generated artifact

The current `combined-suttas.md` at the repo root is **no longer the source of truth**. The six `src/content/en/*.mdx` files are authoritative. `combined-suttas.md` can be regenerated from them by the same build script that produces the PDF.

### The "one typo fix" test

Fix a typo in `src/content/en/fire-sermon.mdx` → next build, the per-teaching page, `/read`, the PDF, the ePub, and the og:image all reflect the fix. One edit, everywhere.

## PDF / ePub build — Phase 2 deferred

The build script will read from `src/content/{locale}/*.mdx`, concatenate in ordinal order, and pipe through pandoc → output to `public/downloads/`. Detailed design is **deferred until pages are built and shipped** — see `todos.md`. Pages first, PDF later.

## File / folder convention (proposed)

```
src/
├── app/
│   └── [locale]/
│       ├── layout.tsx              # locale-aware root layout
│       ├── page.tsx                # /
│       ├── read/page.tsx           # /read
│       ├── about/page.tsx          # /about
│       ├── download/page.tsx       # /download
│       ├── first-talk/page.tsx
│       ├── not-self/page.tsx
│       ├── fire-sermon/page.tsx
│       ├── loving-kindness/page.tsx
│       ├── mindfulness/page.tsx
│       └── how-to-decide/page.tsx
│
├── content/
│   ├── en/
│   │   ├── first-talk.mdx
│   │   ├── not-self.mdx
│   │   ├── fire-sermon.mdx
│   │   ├── loving-kindness.mdx
│   │   ├── mindfulness.mdx
│   │   └── how-to-decide.mdx
│   ├── zh/...
│   ├── th/...
│   └── vi/...
│
├── components/
│   ├── reading/
│   │   ├── SuttaPage.tsx           # single-sutta layout
│   │   ├── ReadAllPage.tsx         # /read assembled view
│   │   └── AnchorNav.tsx           # sticky in-page nav for /read
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── ui/                         # shadcn components
│
├── lib/
│   ├── content.ts                  # MDX loader / sutta registry
│   └── i18n.ts                     # locale config, supported locales
│
└── public/
    ├── downloads/
    │   ├── plain-dharma.pdf
    │   ├── plain-dharma.epub
    │   └── plain-dharma-print.pdf
    └── og/                         # per-teaching og:images
```

If the English-at-root decision goes that way, `[locale]` still wraps everything; the default locale is served from `/` via a rewrite in `next.config.ts`.

## Locale routing

- `app/[locale]/...` dynamic segment wraps the whole route tree
- Supported locales declared in `src/lib/i18n.ts`
- `generateStaticParams` enumerates locales × pages at build time → fully static
- Sutta content is selected by locale: `src/content/{locale}/{slug}.mdx`
- Fallback: if a translation is missing for a given locale, fall back to English with a visible note ("Not yet translated — showing English") rather than 404

## Server-side API routes

A hybrid static/RSC site on Vercel. Two routes are dynamically rendered (not statically prerendered):

| Route | Purpose | Env |
|---|---|---|
| `POST /api/subscribe` | Newsletter signup; sends welcome email to subscriber + notification to owner via Resend. No contact list — the signup *is* the two emails. | `RESEND_API_KEY` |
| `POST /api/checkout` | Stripe Checkout Session creator for the donation flow on `/download/donate` | `STRIPE_SECRET_KEY` |

Everything else is statically generated at build time. Keep all new code compatible with this constraint — don't add server-only features without equivalent justification (paid services with keys that must stay server-side).

## What this site is *not*

- **No auth.** No accounts, no login, no signup.
- **No database.** No CMS, no headless CMS, no Sanity, no Contentful. Content lives in the repo.
- **No user state.** No bookmarks, no progress tracking, no comments.
- **No analytics at launch** (consider plausible/umami post-launch if the user wants distribution metrics — never GA).

This is a reading-first static site. The entire thing should build, deploy, and serve from CDN edge with zero runtime cost.

## SEO

- **Per-teaching pages** are the SEO surface. Each gets:
  - Unique `<title>` and meta description
  - `og:image` (per-teaching — a typeset card with the teaching's English title and Pali name)
  - Canonical URL (`<link rel="canonical">`)
- **`hreflang`** tags on every page enumerating all locale versions
- **`sitemap.xml`** auto-generated from the route tree at build time
- **Structured data** (optional, low priority): `Article` or `Book` schema on per-teaching pages
- **No robots.txt restrictions** — we want crawlers everywhere

## Performance budget

- LCP < 1.5s on cold load (no images above the fold, fonts preloaded via `next/font`)
- Total JS shipped per page: < 50 KB gzipped (this is almost achievable by default with App Router + RSC for a content site)
- Lighthouse 100 across the board is realistic and worth chasing

## Deployment

- **Vercel**, connected to the GitHub repo, main branch auto-deploys to production
- Preview deployments on every PR
- Custom domain `plaindharma.com` once purchased (Phase 1 todo)
- Static export (`output: 'export'`) is a viable fallback if we ever want to host elsewhere — keep the build compatible with it (no server-only features)
