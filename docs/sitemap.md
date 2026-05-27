# Sitemap — Plain Dharma

*Last updated: 2026-05-28*

## Site structure

```
plaindharma.com/
│
├── /                  Home — intro, 6 teachings listed, primary "Read all" CTA
├── /read              All six teachings on one long page with anchor nav
├── /about             About this version (license, who, why, sources)
├── /glossary          Key terms in plain English, with Pali / Sanskrit where it matters
├── /download          PDF / ePub / print-ready files (the dharma-gift hub)
│   └── /download/donate   Stripe Checkout-backed donation flow (EN-only)
│
└── Per-teaching pages (SEO + shareability):
    ├── /first-talk             The Buddha's first talk (Dhammacakkappavattana)
    ├── /not-self               The not-self talk (Anattalakkhana)
    ├── /fire-sermon            Everything is on fire (Ādittapariyāya)
    ├── /loving-kindness        The Mettā Sutta
    ├── /mindfulness            Foundations of mindfulness (Satipaṭṭhāna)
    └── /how-to-decide          How to decide what to believe (Kālāma)
```

## Why this structure

- **Per-teaching URLs** catch organic search traffic. People googling "fire sermon plain english" or "kalama sutta modern translation" land directly on the page they want. Each page is independently shareable and gets its own `og:image` and meta description.
- **`/read`** is the canonical single-page experience — one long scrollable document with anchor nav. This is the URL you share when you want someone to actually read everything. Print stylesheet target.
- **`/download`** is the hub for the dharma-gift physical distribution flow. PDF, ePub, and print-ready files live here. QR codes on physical booklets point here.
- **`/glossary`** is the standing reference page — terms readers encounter on the teaching pages, defined once.
- **`/about`** answers: who made this, why, what license, what sources, what's different about this version. Critical for trust.
- **`/`** is intentionally minimal: tagline, the six teachings as a list, "Read all" CTA. No hero imagery, no ornament — the home page is a doorway, not a destination.

## Localization

English is served at the **root** with no locale prefix. Every additional locale lives under a prefix using its ISO 639-1 code:

```
/zh/...    Simplified Chinese  (live)
/th/...    Thai                (reserved)
/vi/...    Vietnamese          (reserved)
```

Every page in the sitemap above is mirrored under each locale prefix, **except** the `/download` tree — that route ships only in English because it powers a Stripe Checkout flow whose copy and tax handling has not been re-cleared for other markets.

```
/zh/                       Chinese home
/zh/read                   Chinese all-teachings page
/zh/about                  Chinese about page
/zh/glossary               Chinese glossary
/zh/first-talk             Chinese first talk
/zh/not-self
/zh/fire-sermon
/zh/loving-kindness
/zh/mindfulness
/zh/how-to-decide
```

Implementation: rather than an `app/[locale]/...` dynamic segment, EN routes live at `app/...` and the ZH locale lives under `app/zh/...` as a static folder. Each ZH page is a thin wrapper that renders the shared view (e.g. `<SuttaView locale="zh" .../>`, `<GlossaryView locale="zh" />`) — keeping EN URLs prefix-free while the data layer remains fully locale-keyed in `src/content/*`.

`SUPPORTED_LOCALES` in `src/content/index.ts` is the source of truth for which locales are wired in. Adding a new locale = add it there, add a full inner record to `LOADERS`, drop the MDX files under `src/content/<locale>/`, add a folder under `src/app/<locale>/` mirroring the EN routes, and add the corresponding entries to `src/app/sitemap.ts`.

## XML sitemap

`src/app/sitemap.ts` emits `https://plaindharma.com/sitemap.xml` covering:

- The 5 EN static pages (`/`, `/read`, `/about`, `/glossary`, `/download`)
- The 4 ZH static pages (`/zh`, `/zh/read`, `/zh/about`, `/zh/glossary` — no `/zh/download`)
- All 6 EN sutta pages
- All 6 ZH sutta pages

Sutta entries take their `lastModified` from the MDX file mtime; static pages use build time. ZH priorities are nudged 0.1 below their EN twin. Donation and thank-you routes under `/download` are intentionally omitted (noindex anyway).

## Reserved for later

Don't build these yet, but reserve the URLs and mention them in nav planning:

- `/print` — printing & distribution guide for people who want to print their own booklets
- `/translations` — landing page listing available languages with links into each locale tree

## Notes on routing implementation

- All content pages are statically generated at build time (`generateStaticParams`).
- The per-teaching slugs (`/fire-sermon`, `/not-self`, etc.) are deliberately plain English — not transliterated Pali — to match the project's plain-English mission and to catch the search queries real people actually type. The same slugs are reused under each locale prefix so cross-language navigation is mechanical.
- `/read` and each per-teaching page share the same underlying MDX content; the per-teaching page is a single-sutta view of the same source the all-six page renders.
- `dynamicParams = false` in `src/app/[slug]/page.tsx` (and the `/zh` mirror) means slugs outside `SUTTAS` 404 at build time with no server fallback.
