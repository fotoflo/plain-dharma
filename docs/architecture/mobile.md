# Mobile app (React Native / Expo) — Plain Dharma

*Last updated: 2026-06-08*

A React Native port of the reading site, sharing the sutta content with the web
via a pnpm-monorepo workspace. Expo SDK 56 (React 19.2.3 / RN 0.85.3, New
Architecture), file-based routing with `expo-router`.

## Monorepo layout

The repo is a pnpm workspace (`pnpm-workspace.yaml`):

```
plain-dharma/
├── src/ …                 ← the Next.js web app (still at the repo root)
├── apps/mobile/           ← the Expo app
├── packages/content/      ← shared, platform-agnostic sutta content
└── pnpm-workspace.yaml    ← packages: [apps/*, packages/*]; nodeLinker: hoisted
```

- **`nodeLinker: hoisted` is required.** React Native libraries break under pnpm's
  default isolated install (Metro/native autolinking can't resolve symlinked
  deps). It is workspace-wide — pnpm has no per-package linker — so the web also
  installs hoisted. See https://docs.expo.dev/guides/monorepos/.
- The web app has **not** been physically moved to `apps/web/` yet; that
  restructure is deferred. `next build`/dev only compile the Next app graph, so
  `apps/mobile` doesn't affect the web build, but root-level `pnpm lint`/`tsc`
  now also traverse `apps/mobile` (scope/ignore as needed), and Vercel installs
  the whole workspace (heavier install).

## `packages/content` — shared source of truth

Platform-agnostic TypeScript + the canonical `.mdx`, consumed by bundler
transpilation (no build step). Exports (`package.json` `exports` map):

| Export | Contents |
|---|---|
| `.` (`index.ts`) | `SUTTAS`, locales, `SUTTA_BASE`/`SUTTA_DISPLAY`, `getMeta`/`getNeighbors`/`getSuttasInOrder`/`isSuttaSlug`/`getAvailableLocales` |
| `./strings`, `./drops`, `./canonical-links`, `./glossary` | UI strings, editorial drops/preface/closing, Pali refs, glossary |
| `./audio` | `AudioSection`/`AudioManifest` types, `combineManifests` (pure /read stitch), `getAudioFileUrl` |
| `./en/*`, `./zh/*` | the canonical sutta `.mdx` |

What stays **web-only** (not shared, lives in `src/content`): the MDX
`LOADERS`/`loadSutta` (bundler-specific `import('*.mdx')`), the `fs`-based audio
manifest readers, and `illustrations.ts` (`fs.statSync`). As of 2026-05-29 the
content is **deduplicated** — `packages/content` is the single canonical copy
(no more parallel trees to keep in sync). The web's `src/content/index.ts` and
`audio.ts` are thin shims that `export *` from this package and add only those
web-specific pieces; the web app depends on `@plain-dharma/content`
(`workspace:*`) and Next compiles its `.mdx` via `transpilePackages`.

## Content rendering on mobile

The `.mdx` files are plain Markdown (no JSX). `babel-plugin-inline-import`
(see `apps/mobile/babel.config.js`) inlines each `.mdx` as a **raw string** at
build time; `apps/mobile/src/content/markdown.ts` imports all twelve via
**relative paths** (inline-import only resolves relative specifiers, not package
exports), strips the YAML frontmatter, and exposes `getSuttaMarkdown(locale,
slug)`. `MarkdownRenderer` renders it with `react-native-markdown-display`,
styled from the theme tokens + reading prefs (mirrors `.prose-dharma`).

## Theme + reading prefs

- `src/theme/tokens.ts` — ports `globals.css`: `PALETTE` (light/dark),
  `READING_SCALE` (sm .9 / md 1 / lg 1.15 / xl 1.35), mode-aware `CONTRAST_INK`
  + `CONTRAST_BG` (contrast recolors ink AND background — light-high → white,
  dark low/high → flat black), and `FONTS` (Garamond Libre + Atkinson
  Hyperlegible).
- `ThemeContext` — light/dark/system, persisted to AsyncStorage (`theme`) +
  system `useColorScheme`.
- `ReadingPrefsContext` — size/contrast/font, persisted to the web's
  `pd-reading-*` keys.
- Fonts loaded in `app/_layout.tsx` via `expo-font`: Garamond Libre OTFs (reused
  from the web) + Atkinson Hyperlegible (`@expo-google-fonts`, accessible toggle).
- `FloatingReadingControls` — the "Aa" popover (size / contrast / font / theme).

## Audio (`src/audio/`) — `react-native-track-player`

Requires a **custom dev build** (native module; not Expo Go). The custom entry
`apps/mobile/index.js` registers the playback service; `app.json` declares
background-audio (`UIBackgroundModes: ["audio"]`, Android foreground-service
perms).

| File | Role |
|---|---|
| `manifest.ts` | Fetches a sutta's manifest from `plaindharma.com`, derives slow/fast URLs (`fast/<file>`) + durations |
| `service.ts` | Playback service — OS remote controls (lock screen, headphones) |
| `setup.ts` | Idempotent `setupPlayer` + capabilities |
| `AudioProvider.tsx` | Queue state; `load(locale, slug)` and `loadCombined(locale)` (stitched /read queue); fraction-preserving slow↔fast pace switch; **queue rebuild on source URL change** (triggers when online→offline, e.g., after download) |
| `downloads.ts` | Offline: per-language bulk download to `Paths.document`; `isLocaleDownloaded()` checks disk (manifest.json exists for each sutta), not AsyncStorage; **file/disk-based source of truth**; `resolveSuttaSections` returns local `file://` URIs when downloaded, else streams |
| `DownloadsProvider.tsx` | Offline download state + progress |

`AudioPanel` (TOC + transport + tap-to-seek + pace) and `FloatingAudioPlayer`
(the "Listen" pill, with `DownloadControl` in-player download button, `combined` prop for /read) are the UI.

**Lock-screen artwork:** `toTracks()` in `AudioProvider.tsx` attaches the bundled app icon (`assets/images/icon.png`) as lock-screen / Now Playing artwork on every track. The icon is resolved to a URI string via `Image.resolveAssetSource()` to render offline — a local `require()` (not a remote URL) ensures downloaded audio shows artwork without a network round-trip.

### Offline download: detection and playback

**Detection** (`src/audio/downloads.ts` `isLocaleDownloaded()`) is **file/disk-based**:
- Checks whether each sutta's `manifest.json` exists on disk under `Paths.document/{locale}/`.
- Does **not** rely on an AsyncStorage flag (which didn't persist reliably).
- `downloadLocale` / `removeLocale` no longer touch AsyncStorage — they only manage files.
- This is the source of truth for "is this locale ready to play offline?"

**Playback** (`src/audio/AudioProvider.tsx`):
- `loadKey` now **always re-resolves sections and rebuilds the track-player queue** when the resolved source URL changes (e.g., a streaming queue becomes local `file://` URLs after download).
- Previously skipped rebuild on slug-only dedup, so downloaded audio didn't play offline.
- Now detects the URL change and queues the local files.

**UI entry points:**
- `DownloadControl` in `AudioPanel` (the "Listen" pill): shows "Download for offline" when locale is not downloaded, hidden once it is.
- `OfflineDownload.tsx` on the More screen: simplified label "Download for offline", per-language selector + progress bar.

### Audio → page scroll sync

`src/app/[slug].tsx` renders the sutta body as per-section `<View>`s:
- `splitSections` in `src/content/markdown.ts` splits markdown on `## ` headings into id'd sections.
- Each section's Y position is recorded via `onLayout`.
- When audio advances to a new section, `ScrollView` scrolls to that section's Y.
- Keeps the visual flow synchronized with audio playback.

## Custom Tab Bar (scroll-aware + contrast-synced)

The bottom tab bar is a **custom React component** (`AnimatedTabBar` from `src/navigation/TabBar.tsx`), not the default expo-router bar. This enables two features:

1. **Scroll-aware visibility:** the bar slides down-offscreen when the user scrolls down (reading), and slides back up on scroll-up or at page top. `useTabBarScroll` feeds a scroll listener from each scene.
2. **Contrast-aware tinting:** when the user adjusts the "CONTRAST" reading control (low/med/high), the bar's background tints to match the reading page's `CONTRAST_BG[theme][contrast]`. On non-reading tabs (home, more), it stays on the plain theme background.

**Implementation:**
- `TabBarVisibilityProvider` wraps the app (`app/_layout.tsx`), exposing `useTabBarScroll()` and `useTabBarInset()` hooks.
- `AnimatedTabBar` (the custom bar component) is passed to `Tabs` via the `tabBar` prop — it derives its type from React Navigation's internal generics (`Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0]`).
- `useTabBarScroll()` is called inside ScrollViews (e.g., `read.tsx`, `more.tsx`, `index.tsx`).
- `useTabBarInset()` returns the bottom padding a scene needs so its content doesn't hide under the floating bar.
- The bar is absolutely positioned and transforms `translateY` smoothly on scroll threshold changes.

## Routing (`src/app/`, expo-router)

```
app/
├── _layout.tsx         ← providers (Theme, ReadingPrefs, Audio, AudioPanel, Downloads) + fonts + Stack
├── (tabs)/             ← bottom-tab navigator (custom AnimatedTabBar: scroll-aware + contrast-tinted)
│   ├── _layout.tsx     ← Tabs: Home / Read / More
│   ├── index.tsx       ← home (hero + six-teachings list)
│   ├── read.tsx        ← combined /read (all six + combined audio); opens FloatingAudioPlayer
│   └── more.tsx        ← settings, account, support, about+glossary links (iOS Settings-style menu)
├── [slug].tsx          ← single talk, full-screen above the tab bar
├── download/           ← book download → donate → Stripe flow (native)
│   ├── index.tsx       ← edition picker (EPUB / PDF / M4B), mirrors web /download
│   ├── donate.tsx      ← pay-what-you-want; opens web Stripe; offline-listen entry point
│   └── thank-you.tsx   ← auto-delivers the file via the OS share sheet
├── account.tsx         ← sign-in (magic-link) + account settings + delete account
├── donate.tsx          ← direct support link to /download/donate?ref=donate
├── contribute.tsx      ← contact / discuss on Reddit
├── newsletter.tsx      ← email signup (mirrors web /subscribe)
├── about.tsx           ← root-level, pushed
└── glossary.tsx        ← root-level, pushed
```

## Audio panel state lifting (AudioPanelContext)

The floating audio player's "open/closed" state lives in `AudioPanelContext` 
(`src/audio/AudioPanelContext.tsx`), mounted at the app root (in `app/_layout.tsx`), 
above the tab navigator. This allows **any screen to open the listen panel and have 
it stay open when navigating back to the Read tab**.

**Why it's needed:**
- The listen modal ("Download for offline") taps to `/download/donate?ref=listen`, a 
  route outside the (tabs) navigator.
- After the donate flow completes (paid or free), it bounces back to `/read`.
- Without a shared parent context, the listen panel would unmount during navigation 
  and the user would land on a closed panel.

**Flow:**
1. Listen modal taps → `/download/donate?ref=listen` + `setAudioOpen(false)` (hide 
   the panel temporarily during checkout).
2. Stripe success/free-download → `startOfflineListen()` calls `download(locale)` 
   (kick off audio cache in DownloadsProvider) + `setAudioOpen(true)`.
3. `router.replace('/read')` navigates back.
4. Read tab mounts with `audioOpen=true` — FloatingAudioPanel sees the context 
   value and opens itself.

Hooks: `useAudioPanel()` returns `{ audioOpen, setAudioOpen }`. Mounted once at 
app root in `app/_layout.tsx`.

## Book download & offline-listen donation flow

Mirrors the web `/download` → `/download/donate` → Stripe → `/download/thank-you`
flow with native screens (`app/download/`). Two distinct entry points:

**File purchase** (the traditional book download → share to Files):
1. `app/download/index.tsx` — edition picker (EPUB / PDF / M4B).
2. `download?to=donate` → `donate.tsx` (pay-what-you-want Stripe Checkout).
3. Success → `thank-you.tsx` (auto-share via iOS share sheet).

**Offline listening** (new in 2026-06) — from the listen modal:
1. `FloatingAudioPanel` "Download for offline" button → `/download/donate?file=m4b&ref=listen`.
2. `donate.tsx` reads `ref=listen` and shows a two-choice UI:
   - **"Support Plain Dharma"** → Stripe Checkout (optional donation).
   - **"Download for free"** → skip payment (no fundraising friction).
3. On success (paid or free), `startOfflineListen()`:
   - Calls `download(locale)` to cache audio in `DownloadsProvider`.
   - Calls `setAudioOpen(true)` to open the listen panel.
   - Returns to `/read` where the panel is already open.

Donations are **optional** — the file/offline audio is always freely available.
Payment happens on **web Stripe Checkout**, never in-app (App Store policy 
compliance for nonprofits).

**Stripe round trip:**
1. `donate.tsx` POSTs `{ amount, file, platform: "mobile" }` to 
   `plaindharma.com/api/checkout`.
2. `WebBrowser.openBrowserAsync` opens Stripe (no auth-session consent).
3. Stripe redirects success/cancel to `plaindharma.com/download/return?to=thankyou|cancel`.
4. A **Universal Link / App Link** hands the URL back to the app.
5. `donate.tsx`'s `Linking` listener reads `to=` and either:
   - Calls `startOfflineListen()` if `fromListen=true` (offline audio path).
   - Routes to `thank-you.tsx` if file purchase (auto-share).

**Universal / App Link config:**
- `app.json`: `ios.associatedDomains: ["applinks:plaindharma.com"]`;
  `android.intentFilters` (`autoVerify`, host `plaindharma.com`, pathPrefix
  `/download/return`).
- Web hosts the verification files, **scoped to `/download/return*`** so the rest of
  the reading site still opens in a browser:
  - `public/.well-known/apple-app-site-association` — `appID`
    `H78XB55WG8.com.plaindharma.app` (same Apple Developer team as flexbike); served
    as `application/json` via `next.config.ts` `headers()`.
  - `public/.well-known/assetlinks.json` — package `com.plaindharma.app`;
    **`sha256_cert_fingerprints` is still a placeholder** (fill from the EAS Android
    keystore / Play app-signing SHA-256).
- **Reliable here because** `/download/return` is only ever hit from the app's own
  flow (web donations use `/download/thank-you`), so the app is always installed
  when the link fires.

**Operational order:** deploy the web changes first (the AASA must be live for iOS
to verify) → rebuild under `com.plaindharma.app` (native config change) → test on a
real device (simulators don't verify universal links).
`applinks:plaindharma.com?mode=developer` bypasses Apple's CDN cache during dev.

## Assets & backend

Mobile owns no audio/illustration/download files — it streams them from the
deployed `plaindharma.com`:

- Audio mp3s + manifests and illustration PNGs (`expo-image`) hit the live site.
  Book files are fetched to the cache and handed to the OS share sheet
  (`deliverBookFile` — `expo-file-system` + `expo-sharing`).
- Newsletter → `POST plaindharma.com/api/subscribe`. The general "Support" donate
  button → `expo-web-browser` to `/download/donate`. The **book-download** donate
  flow is native — see "Book download & donation flow" below.
- **Implication:** fast-mode audio, the contribute/contact routes, and any new
  content must be **deployed to production** before they work on mobile.

## App identity & icon

Configured in `apps/mobile/app.json`:

- **Name** "Plain Dharma" (home-screen label / `CFBundleDisplayName`), **slug**
  `plain-dharma`, **owner** `fotoflo`.
- **Bundle id / Android package**: `com.plaindharma.app`.
- **EAS project**: `@fotoflo/plain-dharma` (`extra.eas.projectId`). Non-interactive
  `eas` runs authenticate with the `plain-dharma` robot token, stored as `EXPO_TOKEN`
  in the **repo-root** `.env.local` (synced from Vercel).
- **Icon**: the web's saffron watercolor sun disc (`public/logo/mark.png`) centered
  on the `#F5EFE0` paper background, rendered to PNGs with ImageMagick (no AI).
  Variants in `assets/images/`:
  - `icon.png` (1024², flattened) — iOS (`ios.icon`) + top-level `icon` (Android
    legacy + web favicon source).
  - `android-icon-foreground.png` (disc on transparent, inside the adaptive safe
    zone) + `-background.png` (solid paper) + `-monochrome.png` (disc silhouette);
    `adaptiveIcon.backgroundColor` `#F5EFE0`.
  - `splash-icon.png` (transparent disc) + `favicon.png`; splash `backgroundColor`
    `#F5EFE0`. The old Expo `expo.icon` template bundle was removed.
- Because `ios/` is gitignored (CNG), EAS reprebuilds the icon + identity from
  `app.json` on its servers — there is no committed native copy to keep in sync.

## Build / run

Native modules (track-player, async-storage, file-system) mean **Expo Go won't
work** — use a dev build:

```
cd apps/mobile
npx expo run:ios        # prebuild + pods + simulator (first run is slow)
npx expo start --dev-client   # fast JS iteration after the first build
```

**On this Mac (Xcode 26.5):** Local `npx expo run:ios` is blocked — `xcodebuild
-showdestinations` lists no iOS Simulator destinations, only the device
placeholder with *"iOS 26.5 is not installed"* (the platform SDK component isn't
downloaded, even though the 18.6/26.3 sim runtimes are). Fix locally with
`xcodebuild -downloadPlatform iOS`, **or** skip it and use the EAS cloud
simulator build:**

```bash
# EXPO_TOKEN must be set (plain-dharma robot token from repo-root .env.local).
# eas.json "development" profile has ios.simulator:true → an unsigned .app for the sim.
eas build -p ios --profile development --non-interactive

# Download + install the latest build on a booted simulator and launch it, one step:
eas build:run -p ios --latest

# Fast JS iteration after install:
cd apps/mobile && expo start --dev-client
```

`scripts/audio-reencode-ab.sh` (repo root, throwaway) A/Bs lighter mp3 encodings
if download size becomes a concern (files are currently mp3 44.1 kHz mono 64 kbps).

## OTA updates (expo-updates)

The app can receive over-the-air (OTA) JavaScript updates via Expo Updates, without requiring a new App Store / Play Store submission. This is configured in `app.json` and `eas.json`:

- **`runtimeVersion: { policy: "appVersion" }`** in `app.json` pins OTA updates to the app's version (`1.0.0`). Only builds with the same version can receive OTA updates for that channel. Keep version `1.0.0` to push unlimited OTA updates to that build; bumping the version requires a new native rebuild.
- **Per-profile channels** in `eas.json`: each build profile (development, development-device, preview, production) targets a distinct channel. When you publish an update, you specify which channel receives it (e.g., `eas update --channel production`).
- **Publish command:** `pnpm eas update --channel production -m "description of JS changes"`
- **Critical gotcha:** only builds **containing expo-updates** (build #3 onward) can receive OTA updates. The earlier TestFlight builds (#1–#2) do not have the update client and cannot pull new JS. Plan accordingly when shipping updates.

See [Expo Updates docs](https://docs.expo.dev/updates/) for full details.

## Payments & donations

Mobile carries **no Stripe key** (public or secret) and does not call Stripe directly. All payment flows route to the production web endpoint:

- **Book download donations** (`download/donate.tsx`) POSTs to `https://plaindharma.com/api/checkout` (hardcoded in `src/lib/site.ts`), which uses the **live production Stripe keys**. This is true regardless of build profile (development, preview, or production) — there is no test path on the mobile side. Stripe's webhook responses and success/cancel redirects are web-only.
- **General "Support" donations** open the browser to `/download/donate` on the live site, also using production keys.
- This design keeps payment secrets out of the app bundle (compliant and simpler) and avoids App Store policies that prohibit in-app payment for digital goods (unless the org is a registered nonprofit, which Plain Dharma is not).

## Build artifacts & deployment

EAS Build uploads a **single code-signed native binary** (.ipa for iOS, .aab for Android). The `.easignore` file controls what gets uploaded (EAS does not read `.gitignore`):

- Excludes: `node_modules/`, `.git/` (~410 MB), the heavy `public/` media (`public/illustrations/`, `public/downloads/`, `public/logo/`, and **`public/audio/**/*.mp3`**), and web-only dirs (`docs/`, `supabase/`).
- **Keeps `public/audio/**/manifest.json`** (~52 KB): `src/audio/bundled-manifests.ts` inline-imports these so the Listen panel has no first-open fetch. The blanket `public/` exclusion was replaced with targeted excludes because gitignore can't re-include children of an excluded dir. If you re-broaden it, the native build fails at the *Bundle JavaScript* phase — the OTA path hides this, since `expo export` runs locally where `public/` exists.
- This reduces the upload archive from ~439 MB to a few MB, speeding up builds.
- **Maintenance:** new patterns added to `.gitignore` must be mirrored into `.easignore` (they are not auto-synced).

Once a build is submitted to TestFlight or the Play Store, OTA updates become the primary path for rolling out JS changes (reading text, styles, UI tweaks). New native dependencies (navigation, audio, file-system changes) require a full rebuild and re-submission.

## More tab organization (completed 2026-06)

The **drill-down menu refactor (Option C)** shipped on main: `more.tsx` is now a
calm iOS-Settings-style menu with Account card (hidden when sync unavailable),
inline Settings (Appearance only), and drill-down rows for Support (Donate /
Contribute / Newsletter) and About (About / Glossary / Download the book).

New sub-screens (each with a "‹ More" back header via `SubScreen.tsx`):
`app/account.tsx`, `app/donate.tsx`, `app/contribute.tsx`, `app/newsletter.tsx`.

Relocated content:
- **Highlights & notes** → live with reading: per-talk `MarginNotesPanel` now
  shows an "All my notes & highlights →" footer link (wired in `[slug].tsx` via
  `onShowAll` prop) that opens the global `GlobalNotesPanel.tsx` (was
  `MyNotesSection`).
- **Offline audio download** → lives in the `AudioPanel` (FloatingAudioPlayer);
  `OfflineDownload.tsx` on the More tab still works but is unused.

Account/sign-out: the signed-in Account card shows status + an **inline "Sign out"
button** (no drill-down, no chevron). Signed-out card taps to `/account` and shows
a chevron. MenuRow chevron softened (opacity .45, size 16).

See [more-tab-refactor.md](./more-tab-refactor.md) for details.

## Gotchas

- **Inline-import needs relative paths** to the `.mdx` (not the package export),
  and must run under the app's babel config — hence `markdown.ts` lives in
  `apps/mobile/src`.
- **`@types/mdx`** (a hoisted web dep) declares `*.mdx` as an MDX component,
  colliding with the mobile string declaration; the mobile app's own TypeScript
  (6.0.3) resolves the local declaration correctly — run `tsc` from
  `apps/mobile`, not the repo root (root resolves the web's TS 5.x).
- **Decorative backgrounds** (`DecorativeBackground`) are dependency-free
  approximations (translucent discs for the light wash, static dots for the dark
  star field) — no canvas/SVG/blur deps; twinkle animation is a follow-up.
- **`<Link asChild>` rejects ARRAY `style` props** — wrap multi-style arrays in
  `StyleSheet.flatten([...])` (e.g., `apps/mobile/src/app/(tabs)/index.tsx`).
- **Nothing native is runtime-verified by typecheck/bundle** — playback,
  downloads, and the tab bar need a device/simulator run.
- **EAS Build bundles UNCOMMITTED working-tree changes by default** — so a
  concurrent edit (e.g. a stray dep added to the root `package.json`) leaks into
  a build and can fail the *Install dependencies* phase with
  `ERR_PNPM_OUTDATED_LOCKFILE`. Build from a clean tree, or set
  `cli.requireCommit: true` in `eas.json` to force committed-only builds.
- **Native deps fragment the OTA channel.** All production builds share
  `channel: production` + `runtimeVersion: 1.0.0`, so one `eas update` reaches
  them all. Once a build adds a native module (`expo-clipboard`,
  `expo-application`, …), JS that imports it will **crash older builds that lack
  it** if OTA'd. Rule: OTA only pure-JS changes that every live build can run;
  ship anything touching a new native module via a **rebuild**.

## Analytics, accounts & notes (added 2026-05)

- **Analytics:** `src/lib/analytics.ts` posts GA4 events via the **Measurement
  Protocol** over `fetch` (no Firebase/native SDK → OTA-safe), gated to
  production. Reads `EXPO_PUBLIC_GA_MEASUREMENT_ID` (the `G-1Y9P9S2Z8Z` app data
  stream) + `EXPO_PUBLIC_GA_API_SECRET`.
- **Margin Notes** (updated 2026-06): magic-link (passwordless) Supabase auth +
  highlights/notes synced to the same `public.marginalia` table as web. Native iOS
  `UITextView` (react-native-uitextview, Fabric-only) enables paragraph-spanning
  selection. `sectionRuns.ts` flattens markdown AST to styled runs + plain text.
  Highlights paint by offset-based matching. Toolbar offers Highlight / Note /
  Copy / Share. `SelectionToolbar.tsx` anchors to the selection rect.
  `SignInCard` moved to top "Account" section on More tab. See [marginalia.md](./marginalia.md) for full details.
  Reads `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  (now in development + preview EAS envs, previously production-only); the
  magic-link deep link (`mobile://auth/callback`) is allow-listed in Supabase.
  
  **Account deletion** (added 2026-06): The More tab's Account card (when signed 
  in) includes a "Delete account" option. Tapping it shows a confirmation dialog, 
  then calls `AuthContext.deleteAccount()`, which invokes `supabase/functions/delete-account` 
  (an Edge Function that requires a valid JWT). The function calls `admin.auth.deleteUser()` 
  to delete the user from Supabase Auth; `marginalia` rows cascade-delete. After 
  deletion, the user is signed out locally.
  
  **Magic-link error handling** (added 2026-06): The AuthProvider now validates 
  refreshed sessions at app startup — if the refresh token is stale/revoked, the 
  session is purged so a broken "signed in" state doesn't strand the user. The 
  `/auth/callback` screen captures deep-link-derived auth errors (expired/used links) 
  and displays them to the user instead of silently failing.
- **Env vars live as EAS environment variables** (`eas env:create --environment
  production …`), not in `eas.json` — they feed both `eas build` and
  `eas update --environment production`.
- **Build & updates panel** (`src/components/DebugInfo.tsx`, in the More tab):
  reports app/build version, channel, the riding OTA (id or "embedded") + bundle
  date, and Check/Download buttons via `expo-updates` `useUpdates()`.

## TestFlight distribution (App Store Connect API)

`scripts/asc-distribute.mjs` distributes a build via the ASC API (key already
wired for `eas submit`): waits for the build to go `VALID`, sets the "What to
Test" notes, adds it to the internal + external beta groups (creating the
internal group if needed), and submits the external build for Beta App Review.
`node --env-file=.env.local scripts/asc-distribute.mjs latest --whatsnew "…"`.
Note the external group needs Beta App Review per build; internal testers (ASC
users) get builds instantly.
