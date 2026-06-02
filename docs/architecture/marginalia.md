# Margin Notes — Plain Dharma

*Last updated: 2026-06-02*

Reader-owned highlights and private notes on sutta passages, with optional sync to Supabase via magic-link sign-in. A deliberate exception to the site's otherwise static/no-database principle: read-first local-first design keeps annotations available instantly (no server call needed), and unauthenticated readers never touch the database. Implemented on web (browsers) and mobile (React Native / Expo).

## Overview

```
Selection + W3C text-quote anchoring (selectorFromRange)
  ↓
Mark wrapping + instant rendering (wrapRange)
  ↓
localStorage (local-first, persistent across sessions)
  ↓
Optional: magic-link sign-in → Supabase sync
  ↓
Deep-link recovery via ?h= querystring (rangeFromSelector + flash)
```

Marks are client-supplied UUIDs; the same `id` identifies a passage in the DOM, localStorage, and Supabase (no re-keying on sync). Owner-only Postgres RLS ensures unsigned-out readers cannot read or write the table.

## Key files

| File | Role |
|---|---|
| `src/components/marginalia/textAnchor.ts` | W3C-style text-quote anchoring: `selectorFromRange`, `rangeFromSelector`, `wrapRange`, `unwrapMark`, `encodeSelector`, `decodeSelector` |
| `src/components/marginalia/types.ts` | `MarginMark` (client) / `MarginRow` (Supabase schema) type definitions |
| `src/components/marginalia/store.ts` | localStorage persistence + Supabase CRUD; `useSyncExternalStore` reactive store; merge logic on sign-in |
| `src/components/marginalia/useMarginalia.ts` | React hook: local-first state, auth flow, write-through sync to server on mutations |
| `src/components/marginalia/Marginalia.tsx` | Orchestrator: gates on reading surfaces, mounts `MarginaliaLayer` (selection toolbar, mark painting, click popover, deep-link flash, save-prompt, panel trigger) |
| `src/components/marginalia/NoteComposer.tsx` | Modal: add new mark or edit note; cancellable |
| `src/components/marginalia/ShareDialog.tsx` | Share passage + note via URL; shows page-level OG preview (not per-passage) |
| `src/components/marginalia/MarginNotesPanel.tsx` | Sidebar: list all marks on the current page; filter by locale |
| `src/components/marginalia/SavePrompt.tsx` | Toast: prompt to save marks on first interaction (shown once per session) |
| `supabase/migrations/20260528131121_create_marginalia.sql` | `marginalia` table + owner-only RLS; `set_updated_at` trigger; index on `(user_id, slug, locale)` |
| `src/lib/supabase.ts` | Browser Supabase client: lazy singleton, implicit auth flow |
| `src/app/layout.tsx` | Mounts `<Marginalia />` once globally; wraps main content in `<main data-mn-scope>` |
| `src/app/globals.css` | `.dharma-mark`, `.dharma-mark-note`, `.dharma-mark-flash` classes; `--color-highlight` tokens (light/dark) |
| `src/components/ReadingControls.tsx`, `FloatingAudioPlayer.tsx` | Tagged `data-mn-ui` so their text is non-annotatable |

## Data flow

### Selection → Mark

1. User selects text on a reading page (per-sutta or `/read`).
2. `onSelectionChange` listener calls `selectorFromRange` to extract a W3C text-quote anchor: quote (exact text), prefix/suffix (context chars), and anchor (section id).
3. Toolbar appears; user chooses highlight or compose note.
4. `newMark` generates a client UUID and stores in module-level `store` (backed by localStorage).
5. `wrapRange` injects `<mark class="dharma-mark">` elements at the stored range.

### Persistence

- **Signed out:** `setMarks` persists to localStorage (`pd-margin-notes` key) and emits to `useSyncExternalStore` subscribers.
- **Signed in:** `useMarginalia` hook calls `insertRemote` (add), `updateRemoteNote` (edit), `deleteRemote` (delete) on every mutation. Failures are non-fatal; mark stays local with `synced=false` and will retry on next sign-in via `syncOnSignIn`.

### Sign-in sync

1. Magic-link OTP arrives; Supabase auth transitions to a session.
2. `useMarginalia` detects session change and calls `syncOnSignIn`.
3. Server marks are fetched; local-only marks (by id or by passage+note) are pushed up.
4. Deduped result (remote + newly-synced) replaces the store.

### Deep-link recovery

Share dialog generates `?h=<encoded-selector>`. On page load:
1. `MarginaliaLayer` parses `?h=` from the URL.
2. `rangeFromSelector` reconstructs the Range from the stored anchor/quote/prefix/suffix.
3. `wrapRange` re-applies the `<mark>` highlighting (even if the mark doesn't exist as a note).
4. Flash animation pulses the highlighted text to draw attention.
5. URL is cleaned (pushState) so reloads don't re-flash.

## Important patterns and gotchas

**W3C text-quote anchoring is DOM-stable.** When other marks wrap nearby text, no DOM nodes are removed or re-ordered — the injected `<mark>` elements are transparent to text content. Offsets into the flattened text remain valid across renders.

**Client-supplied UUID as primary key.** The same `id` generated on the client (via `crypto.randomUUID()` or fallback) becomes the Supabase `PRIMARY KEY`. This avoids re-keying: local marks, localStorage entries, and server rows all refer to the same identifier. On sign-in, dedup by id first, then by passage+note to avoid pushes of marks that already exist upstream.

**Owner-only RLS is the anti-pattern vector.** The `marginalia` table has strict `auth.uid() = user_id` checks on all operations. An unsigned-out reader (no `auth.uid()`) cannot read, insert, update, or delete any row — the table is inert without authentication, exactly as intended. This is the *only* database table in a site that is otherwise static/no-auth/no-middleware.

**Reading surface gating.** `Marginalia.tsx` returns `null` (no-op) on non-reading pages (home, /about, /contribute, /download, glossary, etc.). It only activates on per-sutta pages (`/[slug]` where slug ∈ `SUTTAS`) or `/read`. The `pageKeyFromPath` utility strips locale prefixes so a passage retains the same key across all languages.

**Scope is `<main data-mn-scope>`.** The root container for selection and anchoring is the `<main>` tag in `layout.tsx`. On per-sutta pages, this is the sutta content; on `/read`, it's all six concatenated texts. Per-sutta slug is derived from the nearest `<section id>` ancestor (typically the sutta wrapper). On `/read`, all marks are scoped to the page-level anchor, but `MarginNotesPanel` filters by locale and lists them separately.

**Per-sutta slug on `/read`.** Each sutta on the `/read` page has a `<section id="{slug}">` wrapper. When anchoring a passage on `/read`, the `anchor` field in the mark defaults to `'doc'` (root) but should be overridden by the nearest section id (e.g. `'fire-sermon'`) if present. This allows sharing a URL that deep-links into a specific sutta within the combined view.

**Page marks filtered by locale.** `MarginNotesPanel` filters the mark list to the current page's locale (e.g. don't show English marks on the Chinese `/read`). The `locale` field in each mark is set when the mark is created, derived from `getLocaleFromPathname`.

**Share dialog shows page-level OG, not per-passage.** The share URL includes the page title and OG image (from `og-meta.ts`), not a generated per-passage preview. This is a deliberate trade-off: per-passage OG images would require server-side rendering or pre-generation, which contradicts the static-first design.

**localStorage scope is document-wide** (not per-page). The `pd-margin-notes` key stores all marks globally, keyed by slug + locale + anchor. This means `/read` and per-sutta pages see the same marks (deduped by id).

**Optional persistence request.** `requestPersistence()` is called on first mount to ask the browser to exempt margin-notes storage from eviction under Intelligent Tracking Prevention (Safari) or other quota-pressure scenarios. It's best-effort; failures are silent.

**Non-annotatable UI regions.** Text in `ReadingControls` and `FloatingAudioPlayer` is tagged `data-mn-ui` so the selection listener skips ranges that start or end within these elements. This prevents users from accidentally selecting "Slower" / "Faster" / "Read Aloud" UI text as part of a sutta passage.

## Schema

```sql
create table public.marginalia (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  slug       text not null,           -- sutta slug
  locale     text not null default 'en',
  anchor     text not null,           -- section id ('doc' if none)
  quote      text not null,           -- exact passage text
  prefix     text not null default '',
  suffix     text not null default '',
  note       text,                    -- null = highlight only; text = private note
  color      text not null default 'amber',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index marginalia_user_page_idx on public.marginalia (user_id, slug, locale);
```

Row-level security (owner-only):
- `SELECT`, `INSERT`, `UPDATE`, `DELETE` all enforce `auth.uid() = user_id`.
- Unsigned-out readers (no session) have `auth.uid() = NULL`, so no row is visible or writable.

## CSS classes and tokens

| Class/Token | Role |
|---|---|
| `.dharma-mark` | Base highlight style: `background-color: var(--color-highlight)` (warm amber wash, opacity 0.34 light / 0.30 dark) |
| `.dharma-mark:hover` | Stronger wash on hover: opacity 0.55 light / 0.48 dark |
| `.dharma-mark-note` | Additional class when a mark has a note; no extra styling (inherited highlight) |
| `.dharma-mark.dharma-flashing` | Keyframe animation: pulse between normal and strong opacity over 1.2s |
| `.dharma-mark-flash` | Used during deep-link recovery; stronger initial opacity, longer duration |
| `--color-highlight` | Base highlight color (light: `rgba(213, 150, 64, 0.34)`; dark: `rgba(224, 131, 58, 0.30)`) |
| `--color-highlight-strong` | Hover/flash intensity (light: `rgba(213, 150, 64, 0.55)`; dark: `rgba(224, 131, 58, 0.48)`) |

## Web implementation

Text selection uses the browser's native `getSelection()` API; marking wraps the selected range with `<mark>` elements. The tooling is transparent to Next.js static export (no server action needed).

## Mobile implementation (React Native / Expo)

Mobile Margin Notes share the same backend, auth, and data schema as web; the selection and highlighting mechanism is distinct due to React Native's different text model.

### Native text selection and highlighting

**Problem:** React Native has no built-in per-character text selection (unlike the DOM). Per-word UITextView measurment was complex and fragile.

**Solution:** Native iOS `UITextView` (via `react-native-uitextview`, Fabric/new-arch only):
1. Each sutta reader `<Section>` renders its content as a **single native UITextView** (`SelectableSectionText.tsx`), enabling paragraph-spanning selection.
2. `sectionRuns.ts` flattens a section's markdown block AST (via MarkdownIt + tokensToAST) into:
   - Styled inline runs (font, weight, italic, color)
   - An exact plain-text string (no markup)
   - List item prefixes ("N. ", "• ") and blockquote italics applied at the text level
   - Tradeoff: lists lose hanging indent (acceptable for accessibility)
3. On selection, the `onSelectionChange` callback receives window-coord `rect` + the selected text.
4. `selectorFromRange` derives a W3C text-quote anchor (quote, prefix/suffix context) from the text's position in the plain-text string, using **offset-based matching** — no DOM traversal.

### Highlight painting by offset

- Highlights are stored as quote + prefix/suffix (same as web).
- On render, the quote is located in the plain-text string using the prefix/suffix context.
- Overlay runs slice across the plain-text offsets; runs are tinted amber where they overlap a highlight.
- Highlights extend over leading opening quotes/parens; list markers tint with their item.

### Selection toolbar and user actions

`SelectionToolbar.tsx` anchors to the selection rect and offers:
- **Highlight** (amber tint, no note) — one-tap apply
- **Note** — open composer (NoteComposer.tsx) to add/edit a note
- **Copy** — expo-clipboard
- **Share** — RN Share API (e.g., iMessage, Mail, Notes, etc.)

### Native patch: react-native-uitextview

`patches/react-native-uitextview@2.2.0.patch` (pnpm patch) adds:
- `editMenuForTextInRange` — empty override to suppress the native iOS edit menu
- `selectionX/Y/Width/Height` — window coordinates on `onSelectionChange` callback
- Applied at build time; codegen + native .mm source + JS type definitions

### Account/sign-in surfacing on mobile (updated 2026-06)

- Account card on the More tab (`apps/mobile/src/app/(tabs)/more.tsx`): hidden entirely when sync is unavailable.
  - **Signed in:** shows email + "Synced across your devices" + an inline **"Sign out" button** (no chevron / drill-down).
  - **Signed out:** "Sign in to sync" card with chevron; tap → `/account` screen (magic-link sign-in).
- "All my notes & highlights →" footer link on per-talk `MarginNotesPanel` opens the global `GlobalNotesPanel.tsx` (all marks, searchable).
- `useMarginalia` hook exposes `email`, `signOut`, `syncAvailable`, `signedIn` for UI consumption.

### Env vars for mobile auth

EAS build/preview environments now include:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

(Previously production-only; now required for development and preview builds.)

## Commands

No new commands; marginalia is built into the dev and production flows. The feature is bundled into the main app and requires no separate scripts.
