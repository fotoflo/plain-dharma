# More-tab refactor — drill-down menu (Option C) + relocate reader content

**Status:** planned, not implemented. Build in a fresh session.
**Scope:** mobile only (`apps/mobile`). Web is untouched.

## Why

`apps/mobile/src/app/(tabs)/more.tsx` is one long `ScrollView` mixing ~9 unrelated
section types (Appearance, Highlights & notes, Download, Listen offline,
Contribute, Support/Donate, Newsletter, About, Glossary, DebugInfo) as a flat
wall of `styles.h` headings. Hard to scan; no hierarchy; doesn't scale.

Two problems, two fixes:
1. **Secondary settings/info are disorganized** → restructure "More" into a calm
   drill-down menu (iOS-Settings pattern): a short list of rows, each pushing to
   a focused sub-screen.
2. **The reader's own content (notes, downloads) lives in a settings tab** →
   relocate it to where the user actually thinks about it (the reader / the
   audio surface), out of "More" entirely.

Decision rationale (UX): drill-down is the best home for low-frequency
set-and-forget content and scales forever; notes/downloads belong in context,
not settings. A 4th "Library" tab was explicitly **deferred** — don't add a tab
until real usage shows people live in their highlights (removing a tab later
reads as a regression).

## Current state (what exists today)

- Tabs: `Home` · `Read` · `More` (`apps/mobile/src/app/(tabs)/_layout.tsx`).
- `more.tsx` renders, in order: title, Appearance (inline 3-way segmented
  control: Light/Dark/Auto via `useTheme().mode/setMode`), `<MyNotesSection/>`,
  Download (`Link href="/download"`), `<OfflineDownload/>`, Contribute pitch +
  "Get in touch", Donate button, `<NewsletterSignup/>`, About + Glossary links,
  `<DebugInfo/>`.
- **Account/login already exists**: `src/marginalia/SignInCard.tsx` — full
  passwordless magic-link sign-in; signed-in shows "Synced · email · Sign out";
  returns null when `useMarginalia().syncAvailable` is false. Already surfaced as
  an "Account" section at the TOP of more.tsx (done in a prior session — keep it,
  it becomes the Account card / Account screen here).
- `src/marginalia/MyNotesSection.tsx` — "My notes & highlights" link → global
  `MarginNotesPanel` (modal) with edit/share/delete. (Its duplicate SignInCard
  was already removed.)
- `src/components/OfflineDownload.tsx` — "save all narration to this device".
- Audio: `FloatingAudioPlayer.tsx` hosts an expandable `AudioPanel.tsx` (there is
  **no** standalone Listen tab/screen — audio lives in the floating player).
- `/download` route exists (`src/app/download/index.tsx`) — the book (epub/m4b)
  edition picker.
- `DebugInfo.tsx` — build number / version diagnostics.

## Target structure

### Root "More" tab — a menu

```
Plain Dharma                         (title)

╭───────────────────────────────────╮
│ ◐  Signed in                      │  Account card (live status). Tap → Account
│    fotoflo@gmail.com              │  screen. Signed-out: "Sign in to sync…" → same.
╰───────────────────────────────────╯  Hidden entirely when !syncAvailable.

Settings
┌───────────────────────────────────┐
│  ◑  Appearance              Auto ›│  row shows current theme; tap → Appearance
└───────────────────────────────────┘  screen (OR keep inline — see decision below)

Support the project
┌───────────────────────────────────┐
│  ♡  Donate                       ›│
│  ✎  Contribute                   ›│
│  ✉  Newsletter                   ›│
└───────────────────────────────────┘

About
┌───────────────────────────────────┐
│  ⓘ  About Plain Dharma           ›│
│  A  Glossary                     ›│
└───────────────────────────────────┘

·············································
Build 12 · v1.0.0                       (DebugInfo demoted to a quiet footer)
```

**Gone from More:** "My notes & highlights" and both downloads (book + offline
audio) — relocated below.

### Sub-screens (each a focused pushed screen with a `‹ More` back header)

- **Account** — signed-in: email + "Synced across your devices" + explanatory
  copy + Sign out. Signed-out: pitch + email field + "Send magic link" →
  "check your inbox". This is just `SignInCard`'s two states given a full screen.
- **Appearance** — Theme list (Light / Dark / Auto with a ✓ on current) + the
  "Follows your device when set to Auto" note. *(Judgment call — see below.)*
- **Donate** — CC0/free framing + "Donate →" (opens secure browser via
  `openDonate()`).
- **Contribute** — the copy-editors / translators / voice-artists pitch +
  "Get in touch →" (`openContribute()`).
- **Newsletter** — `<NewsletterSignup/>` + its one-line description.
- **About** — `/about` content (the existing about copy).
- **Glossary** — `/glossary` content (searchable list).

### Relocated content (leaves "More")

- **Notes** → live with reading:
  - Per-talk panel already exists on the reader (bookmark button →
    `MarginNotesPanel` filtered to the talk; now includes the Sign-out footer).
  - Add an **"All my notes & highlights →"** entry point from that panel (or a
    small header affordance on the reader) that opens the GLOBAL
    `MarginNotesPanel` (all marks, `showSlug`) — i.e. move `MyNotesSection`'s
    global-list behavior to a reader-reachable place.
- **Downloads** → live with listening / the book:
  - `OfflineDownload` ("save narration offline") moves into the expandable
    `AudioPanel` (inside `FloatingAudioPlayer`) — it's an audio concern.
  - "Download the book" (epub/m4b) stays its own `/download` flow; reach it from
    the audio panel and/or About, not from a settings list. (Acceptable to leave
    a single "Download the book" row under About if no better home.)

## Judgment calls to resolve at build time

1. **Appearance: inline vs. its own screen.** A full pushed screen for one 3-way
   toggle is borderline ceremony. **Recommended: keep Appearance inline on the
   root** (a "Settings" group with the existing segmented control) and only
   drill-down for screens with real depth. The ascii above shows the row form;
   pick one. (Author leans inline.)
2. **Downloads home.** Plan assumes audio offline-download moves into
   `AudioPanel`. If that crowds the player, fall back to a small "Offline" screen
   under More. Confirm the AudioPanel has room.
3. **"All notes" entry point.** Decide the exact affordance on the reader (a link
   in the per-talk panel footer vs. a header icon). The per-talk-panel-footer
   link is lowest-friction and needs no new chrome.
4. **Tab count stays 3.** Do NOT add a Library tab in this pass.

## Implementation notes

- expo-router file structure: add sub-screens under `app/(more)/` (or
  `app/settings/…`) as a stack, or use a `more/` stack group so each pushes with
  a native back header. Keep them outside `(tabs)` so they push over the tab,
  iOS-style. Match the existing routing patterns in `src/app/`.
- Reuse, don't rewrite: Account = `SignInCard`; Newsletter = `NewsletterSignup`;
  Contribute/Donate copy comes from `getStrings(DEFAULT_LOCALE).contribute`;
  Appearance = existing `useTheme` segmented control; global notes =
  `MarginNotesPanel` with `showSlug`.
- Keep **Donate glanceable** — it's the first Support row, never buried deeper
  than one tap. Visibility funds the project.
- Row component: build one reusable `<MenuRow icon label value? href|onPress />`
  for the menu so all rows are consistent (chevron, divider, tap target).
- `DebugInfo` → demote to a small footer (build/version line), not a section.
- Strings: any new labels ("Account", "Settings", "Support the project") should
  go through the strings module if one covers mobile More copy; otherwise inline
  is fine (this screen is English-first today).
- Verify: `pnpm exec tsc --noEmit -p tsconfig.json` clean; reload on sim and walk
  every row + back. No new native deps → no rebuild (JS hot-reloads on the
  current dev build).

## Out of scope (explicitly)

- No web changes.
- No new tab.
- No change to the selection/highlighting feature itself.
- No design-system / palette changes — reuse existing tokens.
