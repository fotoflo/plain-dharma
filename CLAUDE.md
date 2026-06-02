# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Plain Dharma (plaindharma.com) — a free, CC0 reading site for six foundational Buddhist suttas in plain modern English. Reading-first hybrid static/RSC site on Vercel: no auth, no database, no middleware, no server actions, no user state.

**Server-side carve-outs** (the only routes that aren't statically prerendered):
- `src/app/api/checkout/route.ts` — Stripe Checkout Session creator powering the donation flow on `/download/donate`.
- `src/app/api/subscribe/route.ts` — newsletter signup, called from the home-page form. Sends a welcome email to the subscriber and a notification to the owner via Resend (no contact list). `RESEND_API_KEY` is server-only so it never reaches the browser.

Everything else should remain compatible with `output: 'export'`. Don't add more API routes or server-only features without equivalent justification (paid services with keys that must stay server-side, or persistence the static site genuinely can't do).

## Commands

| Command | Notes |
|---|---|
| `pnpm dev` | Next.js dev on :8008 |
| `pnpm dev:tunnel` | Dev + ngrok in parallel; auto-prints QR for phone testing |
| `pnpm ngrok:qr` / `pnpm ngrok:status` | Reprint QR / show tunnel status |
| `pnpm build` | Production build (`next build`) |
| `pnpm lint` | ESLint (`eslint-config-next`) |
| `pnpm generate-illustrations` | Run Gemini image generation (needs `GOOGLE_GENERATIVE_AI_KEY` in `.env.local`) |
| `pnpm transparentize-illustrations` | Alpha-fade backgrounds in-place |
| `pnpm generate-audio` | TTS pipeline (run via `node --env-file=.env.local --import tsx`) |
| `pnpm build-remix-assets` | Copy MDX source + build the text/audio zips into `public/downloads` for `/remix` |
| `pnpm upload-assets` | Publish the heavy binaries (audio, illustrations, downloads) to the public Supabase bucket + write `asset-version.json` |

No test runner is configured.

**Heavy assets are offsite.** The audio mp3s, illustrations, and download bundles are **not** committed — they live in a public Supabase Storage bucket (`assets`) + CDN, resolved at runtime through `assetUrl()` in `packages/content/assets.ts`. Only the small per-sutta audio `manifest.json` stays in git (the web build reads it via `fs`). After regenerating audio/illustrations or rebuilding the zips, run `pnpm build-remix-assets` (zips) then **`pnpm upload-assets`** — until you upload, the new media won't appear on the live site (dev pulls from the CDN too). The version map (`packages/content/asset-version.json`) is committed and provides cache-busting hashes + sizes. See `docs/architecture/asset-hosting.md`.

## Architecture (big picture)

**Content is the source of truth, and it lives in one place: the `@plain-dharma/content` workspace package (`packages/content/`).** Six MDX files under `packages/content/en/{slug}.mdx` (and `zh/`) are authoritative for every surface — web *and* the Expo mobile app. `combined-suttas.md` at the repo root, if present, is a *generated artifact* — never edit it as source. (Historically this content was duplicated under `src/content`; it has been deduplicated — see `docs/architecture/content-pipeline.md`.)

**The registry in `packages/content/index.ts` is the only place that knows the canonical order, metadata, and per-locale display strings:**

- `SUTTAS` — canonical slug order (`as const` tuple)
- `SUTTA_META` / `SUTTA_DISPLAY` — title, subtitle, ordinal, `pali_name`, teaser (typed `Record<SuttaSlug, …>`)
- `getMeta`, `getNeighbors`, `getAvailableLocales`, `getSuttasInOrder`

This package is **platform-agnostic** — no MDX loaders, no `fs`. Each app loads the raw `.mdx` its own way:
- **Web** (`src/content/index.ts`) is a thin shim: `export * from "@plain-dharma/content"` plus the Next-only `LOADERS`/`loadSutta` that `import()` the package's `.mdx` through `@next/mdx`. Requires `transpilePackages: ["@plain-dharma/content"]` in `next.config.ts`.
- **Mobile** (`apps/mobile/src/content/markdown.ts`) inline-imports the same `.mdx` files as raw strings via `babel-plugin-inline-import`.

Adding a new sutta = update `SUTTAS`, add to `SUTTA_META`/`SUTTA_DISPLAY`, drop the MDX in `packages/content/{locale}/`, add it to web `LOADERS` and mobile `markdown.ts`. Adding a new locale = add to `SUPPORTED_LOCALES`, add a full inner display record, add an MDX dir. Frontmatter is stripped at compile time by `remark-frontmatter` (web) / `stripFrontmatter` (mobile) — it does not render — so anything you need on the page must live in `SUTTA_META`.

**Routing.** App Router. English currently served at `/` with no locale prefix. `src/app/[slug]/page.tsx` calls `generateStaticParams` from `SUTTAS` and sets `dynamicParams = false`, so unknown slugs are build-time 404s. Locale routing under `app/[locale]/...` is planned but not implemented — see `docs/sitemap.md`.

**Adjacent content modules** (canonical copies under `packages/content/`, imported via `@plain-dharma/content/*`):
- `drops.ts` — editorial one-liners (`<Drop />`) and `PREFACE`/`CLOSING` framing for `/read`
- `canonical-links.ts` — Pali Nikaya references + scholarly translation links
- `glossary.ts` — glossary entries
- `strings.ts` — UI copy via `getStrings(locale)`
- `audio.ts` — platform-agnostic audio types + the pure `combineManifests` stitcher; `getAudioFileUrl` resolves a track to its CDN URL via `assets.ts`
- `assets.ts` — `assetUrl`/`assetDownloadUrl`/`assetSize`/`hasAsset`: resolve a bucket-relative path to its public Supabase CDN URL (cache-busted from `asset-version.json`). The one place that knows where the heavy binaries live; used by both web and mobile

**Web-only content modules** (stay under `src/content/`):
- `illustrations.ts` — `getIllustrationUrl(slug)` returns the CDN URL via `assetUrl` (no `fs` — safe anywhere)
- `audio.ts` — a shim that re-exports `@plain-dharma/content/audio` and adds the `fs`-based manifest reader (`getAudioManifest`/`getCombinedAudioManifest`): reads the local `manifest.json` for metadata, resolves track URLs to the CDN
- `en_tts/`, `zh_tts/` — TTS narration source text (intentionally distinct from the reading MDX); consumed by `scripts/generate-audio.ts`

**Illustration pipeline.** `scripts/generate-illustrations.ts` calls Gemini's image model (tries several model names — Google's preview endpoints rename often; update `MODEL_CANDIDATES` when they change), writes to `public/illustrations/{slug}.png`, skips slugs whose file already exists (safe re-runs). Then `scripts/transparentize-illustrations.ts` alpha-fades the near-white Gemini background to transparent (luma > 0.86 + low saturation, soft edge) using ImageMagick if available, else `sharp`. Optional `{slug}-dark.png` variants render via `dark:hidden` / `hidden dark:block` in `SuttaIllustration.tsx` (CSS-only, no hydration).

**Design system.** Tailwind v4 with `@theme inline` in `src/app/globals.css` aliasing raw `--color-*` CSS variables. Dark mode is a `.dark` class on `<html>`; `ThemeToggle.tsx` exports a `themeInitScript` string injected via `dangerouslySetInnerHTML` in `layout.tsx` to apply the saved/system theme before first paint (flicker-free). Reading pages use the custom `.prose-dharma` class — *not* shadcn's `prose`. Body font: Garamond Libre (local OTFs in `src/app/fonts/`); UI font: Geist Sans (npm `geist` package).

## Gotchas

- **Turbopack remark plugins must be string names**, not imported functions, in `next.config.ts` — Rust can't cross the JS boundary with function refs. Use `[["remark-frontmatter", ["yaml"]]]`.
- **`images.remotePatterns` is load-bearing in production.** `<Image>` loads illustrations from the Supabase CDN, so the `ffoiltrarbdbibmymlqm.supabase.co` `/storage/v1/object/public/assets/**` remote pattern in `next.config.ts` must stay — without it Next refuses to optimize the remote image. `/logo/**` is still a `localPattern`.
- **Legacy asset URLs redirect (308) to the CDN.** `next.config.ts` `redirects()` sends `/audio`, `/illustrations`, `/downloads` to the bucket so already-shipped mobile builds and old shared links don't 404. Because of this, *everything* under `public/downloads/` must exist in the bucket (the upload script uploads the whole tree, including `text/`) — don't leave a path served only locally, or the redirect will 404 it.
- **Don't reintroduce `?v=<mtime>` / `fs` for asset URLs.** Cache-busting now comes from the content hashes in `asset-version.json` (written by `pnpm upload-assets`). `assetUrl` is pure and safe in client/edge code.
- **`dynamicParams = false`** in `src/app/[slug]/page.tsx` means slugs outside `SUTTAS` 404 at build time with no server fallback.
- **ngrok versions split.** `scripts/shell/ngrok-dev.sh` prefers the system `ngrok` (v3 config: `~/.config/ngrok/ngrok.yml`) and falls back to `node_modules/.bin/ngrok` (v2 — different YAML format). `pnpm dev:tunnel` sets `NGROK=1`; the `dev` script forks ngrok only if that env var is set.
- **`allowedDevOrigins` in `next.config.ts`** allowlists the dev LAN IP (`192.168.1.140`) and ngrok hostnames so phones/HMR can load `/_next/*`. Update the LAN IP if your network changes. Dev-only — has no production effect.
- **`tsx` scripts under `scripts/`** are outside the Next.js compile graph; changes require re-running the script manually.

## Deeper docs

`docs/architecture/` has detailed pages on each system — read these before non-trivial changes:

- `overview.md` — full stack, file conventions, locale plan
- `content-pipeline.md` — MDX + registry data flow
- `design-system.md` — palette, typography, `Wash`/`NightSky`/`ThemeToggle` internals
- `illustrations.md` — Gemini generation + transparency pipeline
- `asset-hosting.md` — heavy media offsite on the Supabase CDN (`assetUrl`, upload flow, redirects)
- `dev-workflow.md` — ngrok, MDX authoring, phone-on-LAN
- `deployment.md` — Vercel project `fastmonitor/plain-dharma`, DNS, static-export compatibility
- `mobile.md` — React Native (Expo) app, pnpm monorepo (`apps/mobile` + `packages/content`), shared content, audio/offline

`DESIGN_REVIEW.md` at the repo root is a code+rendered-asset review with measured WCAG contrast numbers and prioritized fixes — consult before changing palette tokens or the muted-ink scale.
