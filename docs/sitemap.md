# Sitemap — Plain Dharma

*Last updated: 2026-05-25*

## Site structure

```
plaindharma.com/
│
├── /                  Home — intro, 6 teachings listed, primary "Read all" CTA
├── /read              All six teachings on one long page with anchor nav
├── /about             About this version (license, who, why, sources)
├── /download          PDF / ePub / print-ready files (the dharma-gift hub)
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
- **`/about`** answers: who made this, why, what license, what sources, what's different about this version. Critical for trust.
- **`/`** is intentionally minimal: tagline, the six teachings as a list, "Read all" CTA. No hero imagery, no ornament — the home page is a doorway, not a destination.

## Localization

Translations are handled via a **locale prefix segment** at the root:

```
/cn/...    Chinese
/th/...    Thai
/vt/...    Vietnamese
...etc
```

Codes as written by the user. **Recommendation: revisit to standard ISO 639-1 codes before locking in** — i.e. `zh` (Chinese), `th` (Thai), `vi` (Vietnamese). Standard codes are friendlier to browser language detection, hreflang tags, and SEO tooling.

Every page in the sitemap above gets mirrored under each locale prefix:

```
/cn/                   Chinese home
/cn/read               Chinese all-teachings page
/cn/fire-sermon        Chinese fire sermon
...
```

Implementation: Next.js App Router `[locale]` dynamic segment at the top of the route tree — `app/[locale]/...`.

### Open decision: English locale

English is the default. Two options:

1. **English at root** (no prefix): `/read`, `/fire-sermon`. Locale routing only kicks in for non-English. Cleanest URLs for the dominant audience.
2. **English at `/en`**: `/en/read`, `/en/fire-sermon`. Symmetric — every locale gets a prefix. Easier i18n logic, friendlier hreflang.

**Flag**: pick before launch. Default recommendation is option 1 (English at root) with a permanent redirect from `/en/*` → `/*` so both work.

## Reserved for later

Don't build these yet, but reserve the URLs and mention them in nav planning:

- `/audio` — audiobook embeds / streaming (after ACX recording in Phase 6)
- `/print` — printing & distribution guide for people who want to print their own booklets
- `/translations` — landing page listing available languages with links into each locale tree

## Notes on routing implementation

- All content pages are statically generated at build time (`generateStaticParams`).
- The per-teaching slugs (`/fire-sermon`, `/not-self`, etc.) are deliberately plain English — not transliterated Pali — to match the project's plain-English mission and to catch the search queries real people actually type.
- `/read` and each per-teaching page share the same underlying content source; the per-teaching page is a single-sutta view of the same MDX/markdown.
