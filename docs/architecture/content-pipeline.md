# Content Pipeline — Plain Dharma

*Last updated: 2026-05-29*

Single source of truth: one MDX file per teaching, living in the
**`@plain-dharma/content` workspace package (`packages/content/`)** and shared
by both the web app and the Expo mobile app. Every surface (per-teaching page,
`/read`, home listing, og:image, the ebook/PDF/audiobook builds, the mobile
reader) is composed from these files — nothing else stores the text.

> **History:** this content used to be physically duplicated under `src/content`
> (web) and `packages/content` (mobile), which silently drifted. It has been
> deduplicated into the package; `src/content` now holds only web-specific shims
> and assets. See the *Per-app loading* section below.

## Canonical layout — `packages/content/`

```
packages/content/                 ← @plain-dharma/content (platform-agnostic; no fs, no loaders)
     │
     ├── en/*.mdx / zh/*.mdx  ─── teaching texts per locale (THE source)
     │
     ├── index.ts  ─── SUTTAS array (canonical order)
     │              ── SUTTA_BASE (slug, ordinal, pali_name)
     │              ── SUTTA_DISPLAY[locale] (title, subtitle, teaser, kicker_override)
     │              ── getMeta(locale, slug) / getSuttasInOrder(locale)
     │              ── getNeighbors / getAvailableLocales (derived from SUTTA_DISPLAY)
     │
     ├── strings.ts  ─── i18n UI strings (nav, audio, home, footer, etc.); getStrings(locale)
     ├── drops.ts    ─── DROPS[locale][slug] + PREFACE[locale] / CLOSING[locale]
     ├── canonical-links.ts ─── CANONICAL_LINKS[locale][slug]
     ├── glossary.ts ─── GLOSSARY[locale][] (locale-parallel entries)
     └── audio.ts    ─── AudioManifest/AudioSection types, getAudioFileUrl,
                         combineManifests() — PURE stitcher (no fs)
```

Consumed via the package's `exports` map: `@plain-dharma/content`,
`@plain-dharma/content/strings`, `/drops`, `/canonical-links`, `/glossary`,
`/audio`, and `/en/*` · `/zh/*` for the raw MDX.

## Per-app loading (the two bundler mechanisms)

The MDX is shared, but each bundler resolves it differently — this is why the
loaders are app-specific while the content is not:

| App | How it loads MDX | Where |
|---|---|---|
| **Web** (Next.js) | `@next/mdx` compiles `.mdx` → React components; dynamic `import()` per sutta/locale | `src/content/index.ts` (`LOADERS`/`loadSutta`) |
| **Mobile** (Expo/Metro) | `babel-plugin-inline-import` reads `.mdx` as a raw string | `apps/mobile/src/content/markdown.ts` |

**Web requires `transpilePackages: ["@plain-dharma/content"]` in `next.config.ts`**
— without it Next won't run the MDX loader over files inside the package, and the
`import("@plain-dharma/content/en/*.mdx")` loaders fail.

### Web shims under `src/content/`

`src/content` is no longer canonical content — it holds only:

| File | Role |
|---|---|
| `index.ts` | `export * from "@plain-dharma/content"` + Next-only `LOADERS`/`loadSutta` (import the package `.mdx`). The `@/content` alias still resolves here. |
| `audio.ts` | `export * from "@plain-dharma/content/audio"` + the `fs`-based readers `getAudioManifest` / `getCombinedAudioManifest` (the latter delegates stitching to the package's pure `combineManifests`). |
| `illustrations.ts` | `getIllustrationUrl(slug)` — mtime-versioned URLs (reads the filesystem; server-only). Web-only, never duplicated. |
| `en_tts/`, `zh_tts/` | TTS narration source text — intentionally distinct from the reading MDX (inline audio tags); consumed by `scripts/generate-audio.ts`. Not part of the shared content. |

Web app code imports leaf content modules directly from the package
(`@plain-dharma/content/strings`, `/drops`, `/canonical-links`, `/glossary`),
and the registry/loader/audio shims via the `@/content`, `@/content/audio`
aliases.

## Frontmatter convention

MDX files carry YAML frontmatter, but it is **stripped before render** — by
`remark-frontmatter` on web, and `stripFrontmatter()` on mobile. Metadata lives
in `SUTTA_DISPLAY`/`SUTTA_BASE` in `index.ts` so it is typed and tree-shakeable.

```mdx
---
slug: fire-sermon
title: The Buddha's Third Talk: The Fire Sermon
subtitle: Given on a hilltop near Gaya...
ordinal: 3
---

The body of the teaching starts here.
```

## Data flow

```
LOADERS[locale][slug]()       →  dynamic import of compiled .mdx module (web)
  └── mod.default (ComponentType) rendered inside <article className="prose-dharma">

getSuttaMarkdown(locale, slug) → raw inlined string, frontmatter stripped (mobile)

getMeta(locale, slug)         →  title / subtitle / pali_name / teaser
  └── used by: [slug]/page, read/page, home/page, generateMetadata(), mobile screens

getStrings(locale)            →  all UI strings including canonicalLinks, glossary labels
DROPS[locale][slug]           →  <Drop text={...} /> after each article
CANONICAL_LINKS[locale][slug] →  <CanonicalLinks locale={locale} slug={slug} />
GLOSSARY[locale]              →  <GlossaryView locale={locale} />
```

## Important patterns and gotchas

**Turbopack-compatible remark plugins** — `remarkPlugins` in `next.config.ts`
must use string names, not imported functions (Rust can't cross the JS boundary
with function refs): `remarkPlugins: [["remark-frontmatter", ["yaml"]]]`.

**Adding a sutta touches both apps** — update `SUTTAS` and `SUTTA_DISPLAY` in
the package, drop the MDX into `packages/content/{locale}/`, then register it in
both web `LOADERS` (`src/content/index.ts`) and mobile `RAW` (`markdown.ts`).
The web `LOADERS` record is exhaustive — TS errors if a slug is missing.

**`getAvailableLocales(slug)`** is derived from `SUTTA_DISPLAY` (the per-locale
content map), not from a bundler-specific loader map — keeping it
platform-agnostic and O(1).

**One typo fix, everywhere** — edit a word in `packages/content/en/fire-sermon.mdx`
and the web page, `/read`, og:image, ebook/PDF/audiobook builds, **and** the
mobile reader all pick it up. (This single-edit property is the whole point of
the dedup.)

**`combined-suttas.md` is a generated artifact**, not a source. The six
`packages/content/en/*.mdx` files are the canonical source.

**Build scripts** (`scripts/build-ebook.ts`, `build-audiobook.ts`,
`lib/book-source.ts`, `generate-og-fonts.ts`) and the TTS pipeline
(`generate-audio.ts`) all read content from `@plain-dharma/content` /
`packages/content/{locale}/`, not from `src/content`.

## Audio narration

Audio playback is built atop the MDX content. See `docs/architecture/audio.md` for the full
TTS pipeline, per-sutta and combined playlists, and the auto-scroll-to-anchor behavior that
ties audio playback to page sections via heading anchors (generated by `rehype-slug`).

Audio URLs are cache-busted via `versionSuffix()` in the web `src/content/audio.ts`
shim — each mp3 file gets a `?v=<mtime-seconds>` suffix appended during manifest
load (RSC/build time), so regenerating an mp3 automatically invalidates cached copies.
The pure `combineManifests()` stitcher lives in the package and is shared with mobile.
