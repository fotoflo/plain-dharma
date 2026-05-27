# Audio Playback — Plain Dharma

*Last updated: 2026-05-28*

Synthesized narration for all six suttas. Audio is generated via OpenAI's TTS API or
ElevenLabs' API, mirrored into MDX files with inline pause/emphasis tags (for ElevenLabs),
then served from long-cached static mp3s. Per-sutta playlists appear on individual teaching
pages; a combined playlist stitches all six together on `/read`.

## Overview

```
scripts/generate-audio.ts
  → reads MDX + voice prompt
  → OpenAI gpt-4o-mini-tts OR ElevenLabs eleven_v3/v2
  → chunks text by ## heading into "title", "opening", "body", "drop" sections
  → public/audio/{locale}/{slug}/{id}.mp3
  → public/audio/{locale}/{slug}/manifest.json

src/content/audio.ts
  → getAudioManifest(locale, slug)        → loads per-sutta manifest
  → getCombinedAudioManifest(locale)      → stitches all 6 into one playlist for /read
  → getAudioFileUrl(locale, slug, file)   → constructs /audio/... URL

src/app/[slug]/page.tsx
  → id="title" / id="preface" / id="opening" / id="drop" anchors
  → renders <FloatingAudioPlayer manifest={manifest} />

src/app/read/page.tsx
  → <section id={slug}> for each of six suttas
  → <FloatingAudioPlayer manifest={combinedAudio} /> with cross-sutta playback

src/components/AudioPlayer.tsx
  → cross-section fade-out (700ms) + silence gap (1400ms)
  → MediaSession API integration (lock-screen player controls)
  → auto-scroll-to-anchor when section changes (rehype-slug H2 anchors + page-level ids)
  → memoized getFileUrl() so player survives popup toggle

src/components/FloatingAudioPlayer.tsx
  → keeps AudioPlayer mounted when popup closes to avoid interrupting playback
```

## Key files

| File | Role |
|---|---|
| `scripts/generate-audio.ts` | TTS pipeline: reads MDX, calls OpenAI/ElevenLabs API, writes mp3s + manifests |
| `src/content/en_tts/` | ElevenLabs-specific MDX mirrors with inline pause/emphasis tags |
| `src/content/audio.ts` | `getAudioManifest` / `getCombinedAudioManifest` — loads JSON playlists; `versionSuffix()` appends cache-bust query string |
| `src/content/strings.ts` | `getStrings(locale).audio` — UI labels (listen, pause, play, prev, next, back5, forward5, seek, close, section templates) |
| `src/components/AudioPlayer.tsx` | Two-mode playback UI: TOC (section list) ↔ Player (transport row + scrubber); accepts `locale` prop; strings from `getStrings` |
| `src/components/FloatingAudioPlayer.tsx` | Wraps AudioPlayer in a closeable popup; keeps audio mounted; passes `locale` through |
| `public/audio/{locale}/{slug}/` | Output: per-sutta mp3s + manifest.json (URLs include cache-bust `?v=<mtime>` suffix) |
| `next.config.ts` | `rehypePlugins: [["rehype-slug"]]` adds id="..." to H2 headings |
| `.env.local` | `OPENAI_API_KEY` or `ELEVEN_LABS_API_KEY` required |
| `.claude/settings.json` | tsconfig excludes `scripts/` from typecheck |

## Generation pipeline

```
pnpm generate-audio [slug] [locale] [--provider=openai|elevenlabs] [--model=eleven_v3] [--voiceId=...] [--section=...]
```

Reads `OPENAI_API_KEY` or `ELEVEN_LABS_API_KEY` from `.env.local` (passed via
`node --env-file=.env.local`).

**MDX parsing:**
- Strips YAML frontmatter
- Splits on `^## ` to extract sections (heading + body)
- Each section becomes a separate audio file: `{section-id}.mp3`
- Synthetic sections: `title` (H1), `preface` (first-talk only), `opening` (preamble),
  `drop` (final wisdom line)

**Provider selection:**

**OpenAI** (`--provider=openai`, default):
- Model: `gpt-4o-mini-tts`
- Voice: `sage` (can override with env var `OPENAI_VOICE`)
- Reads clean source `src/content/en/{slug}.mdx`
- Voice direction passed as `instructions` field
- Strips markdown formatting before sending

**ElevenLabs** (`--provider=elevenlabs`):
- Model: `eleven_v3` (default) or `eleven_multilingual_v2` via `--model=`
- Voice ID: `BpjGufoPiobT79j2vtj4` (Priyanka, default) or custom via `--voiceId=`
- Reads TTS-mirror `src/content/{locale}_tts/{slug}.mdx` with inline audio tags
- Understands `[pause]`, `[long pause]`, `[gentle]` tags (only in v3)
- Falls back to `src/content/{locale}/{slug}.mdx` if mirror doesn't exist

**Duration:**
- Uses `ffprobe` to measure actual mp3 duration (accurate)
- Falls back to estimation (coarse) if ffprobe unavailable
- Stored in manifest for UI progress bar

**Auto-mirror to live dir:**
- Generated files go to `public/audio/{locale}/{slug}/`
- Even if the source is `en_tts/`, output mirrors the live directory structure
- Safe to regenerate — existing files are skipped; only new sections are created

## Manifest structure

```json
{
  "slug": "first-talk",
  "locale": "en",
  "voice": "sage",
  "model": "gpt-4o-mini-tts",
  "generated_at": "2026-05-27T22:00:00Z",
  "sections": [
    {
      "id": "title",
      "title": "The Buddha's First Talk: The Middle Way",
      "file": "01-title.mp3?v=1717000800",
      "duration_sec": 14.3
    },
    {
      "id": "opening",
      "title": "Opening",
      "file": "02-opening.mp3?v=1717000800",
      "duration_sec": 41.2
    },
    {
      "id": "the-three-marks",
      "title": "The Three Marks of Existence",
      "file": "03-the-three-marks.mp3?v=1717000800",
      "duration_sec": 127.5
    }
  ]
}
```

Per-sutta manifests are at `public/audio/{locale}/{slug}/manifest.json`. Each `file` entry
includes a `?v=<mtime-seconds>` suffix (appended by `versionSuffix()` in `audio.ts` during
load, mirroring the illustrations pattern). When an mp3 is regenerated, its mtime changes
and the URL automatically changes, invalidating the browser cache.

Combined manifest (for `/read`) has:
- `slug: "all"`
- section IDs prefixed with slug (`"first-talk--opening"`, `"first-talk--the-three-marks"`, etc.)
- absolute `/audio/...` file paths with cache-bust suffixes (since sections live in different per-sutta dirs)

## Playback flow

**Per-sutta pages** (`/first-talk`, etc.):
1. `src/app/[slug]/page.tsx` calls `getAudioManifest(locale, slug)`
2. `<FloatingAudioPlayer manifest={manifest} audioBaseUrl="/audio/en/first-talk" />`
3. Player loads sections sequentially; each section is a separate mp3 file

**Combined reading** (`/read`):
1. `src/app/read/page.tsx` calls `getCombinedAudioManifest(locale)`
2. Stitches all 6 per-sutta manifests into one playlist
3. `<FloatingAudioPlayer manifest={combinedAudio} audioBaseUrl="" />`
4. Player seamlessly streams across all six suttas without reload

## AudioPlayer — two-mode UI

AudioPlayer switches between TOC (section list) and Player (transport controls) modes based on playback state:

**TOC Mode** (paused):
- Displays a scrollable list of all sections with durations
- Each row shows a play icon, section title, and duration (e.g., "3:42")
- The active/currently-loaded section is highlighted with a subtle bg and accent color
- Footer shows total section count and combined duration (e.g., "6 sections · 28 minutes total")
- Tap any row to jump to that section and start playing; tap the active row to resume from where you paused

**Player Mode** (playing):
- Hides the section list and shows the current section title (centered, serif)
- Transport row spreads across the full width: prev section | back 5s | **BIG PAUSE** | fwd 5s | next section
- All transport buttons `stopPropagation()` to prevent the wrapper's click-to-pause from firing
- Progress scrubber (range input) + elapsed/total time below the transport row
- Anywhere else in the player box (except scrubber) pauses playback and returns to TOC mode
- X button in the header (when playing) pauses playback; the popup itself stays open
- All button labels and aria-labels come from `getStrings(locale).audio` for i18n support

**Cross-section transitions:**
- Last 700ms of each section fades from 1.0 to 0.0 volume
- 1400ms silence gap before the next section starts
- Next section begins at full volume (no fade-in; gap is enough)
- Prevents jarring cuts and gives the reader breathing room

**Auto-scroll-to-anchor:**
- When a section changes, AudioPlayer scrolls the page to that section's anchor
- Per-sutta pages have synthetic anchors: `id="title"`, `id="preface"`, `id="opening"`, `id="drop"`
- Section-level H2 headings get auto-generated ids via `rehype-slug` in `next.config.ts`
- Scroll behavior: `scroll-mt-8` on the target to leave breathing room below the header

**MediaSession API integration:**
- Lock-screen player controls (native iOS/Android media controls)
- Updates metadata (title, duration, cover art) when section changes
- Allows play/pause from device controls
- Transport callbacks (goPrev/goNext/seekBy) are wired to both visible buttons and MediaSession actions

**Memoized file URL resolution:**
- `getFileUrl()` callback is memoized on `audioBaseUrl`
- Per-sutta manifests: bare filenames ("01-opening.mp3?v=...") → resolved to "/audio/en/slug/01-opening.mp3?v=..."
- Combined manifest: absolute paths ("/audio/en/first-talk/01-opening.mp3?v=...") → passed through
- Prevents listener re-attachment when parent re-renders (e.g., FloatingAudioPlayer toggle)

## Floating popup behavior

`FloatingAudioPlayer` wraps `AudioPlayer` in a collapsible popup:
- Popup state: button at bottom-right of page
- When closed: `display: none` on the popup container, but `AudioPlayer` stays mounted in DOM
- Prevents audio interruption on toggle
- `audio` HTML element is controlled by the unmounted-but-still-in-memory AudioPlayer ref

## Cache headers

```ts
// next.config.ts
source: "/audio/:path*",
headers: [{
  key: "Cache-Control",
  value: "public, max-age=604800, stale-while-revalidate=86400"
}]
```

Audio mp3s cache for 7 days; after that, the browser can serve stale copies for 1 day
while fetching fresh in the background. Prevents repeat visits from re-downloading,
but allows occasional updates without manual cache busting.

## Important patterns and gotchas

**Cache-busting with `versionSuffix()`** — `audio.ts` calls `statSync()` on each mp3 file
at load time (during RSC/build), appends `?v=<mtime-seconds>` to the file URL in the manifest,
and the browser cache automatically invalidates when the file is regenerated. This mirrors
the illustrations pattern. Server-only; never import `versionSuffix()` into Client Components.

**`locale` prop is required** — AudioPlayer and FloatingAudioPlayer both accept a `locale`
prop to fetch UI strings from `getStrings(locale).audio`. All button labels, aria-labels,
and template strings come from there for i18n. Missing locale will cause a runtime error.

**Strings are templates** — `getStrings(locale).audio.playSectionLabel` and `sectionsTotalLine`
are template strings with `{title}`, `{n}`, and `{time}` placeholders. AudioPlayer interpolates
them at render time via `.replace()` calls. Update `src/content/strings.ts` when adding new
placeholder strings or locales.

**Section IDs must be unique** — the script uses kebab-case heading text to generate
`id="opening"`, `id="the-three-marks"`, etc. Duplicate H2 headings within a sutta will
cause ID collisions (only the last section will be reachable). Ensure each H2 is unique.

**ElevenLabs requires the TTS mirror** — if you use `--provider=elevenlabs` without a
corresponding `src/content/{locale}_tts/` directory, the script falls back to the clean
source; inline audio tags will be stripped by the fallback path. For full audio tag support,
maintain the TTS mirror.

**Voice prompt must exist** — the ElevenLabs path reads `src/content/{locale}_tts/voice-prompt.txt`
which contains narrator direction ("Speak with calm and measured tone..."). If absent, the
script logs a warning and continues with an empty prompt.

**ffprobe optional but recommended** — duration is estimated (coarse) if ffprobe is unavailable.
For accurate playback duration in the UI, install ffmpeg or ffprobe (e.g. `brew install ffmpeg`
on macOS). Already in Vercel's standard runtime.

**MediaSession metadata** — AudioPlayer sets `navigator.mediaSession.metadata` with title,
duration, and a placeholder cover art. Some browsers / lock-screen implementations may not
render all metadata — this is expected and graceful.

**`audioBaseUrl` must end without `/`** — the player appends `/${file}` to the base URL.
Pass `/audio/en/first-talk` not `/audio/en/first-talk/`. Combined manifests pass `""` as
base since file paths are absolute.

**rehype-slug on next build only** — H2 heading ids are generated at build time, not runtime.
If you edit a heading, rebuild to get the new anchor. Dev mode reflects changes immediately,
but production pages are static and must be rebuilt.
