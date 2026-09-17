# Spotify for Authors — Plain Dharma audiobook

Field-by-field inputs for the Spotify audiobook shelf, ordered to match the
upload flow. Companion to `ACX_PUBLISHING.md` (same audio files, ACX-specific
form fields); shared metadata (description, byline, categories) is deliberately
kept consistent across all retailers. Audio assets live in a single shared
build directory: **`dist/acx-and-spotify/`**, produced by `pnpm build-spotify`.

Portal: <https://authors.spotify.com/> → **Get started** → *Upload audiobook*

**Why Spotify and ACX both work.** Both retailers accept digital-voice
narration with a metadata disclosure (Spotify's checkbox, ACX's narrator
field). Both are non-exclusive, charge no listing fee, and pay royalties on
the standard retailer split. The same chapter audio files satisfy both
platforms' spec; only the form metadata differs. See `ACX_PUBLISHING.md` for
the Audible-specific upload guide and the ACX policy citations.

---

## Files to upload (already built, in `dist/acx-and-spotify/`)

Rebuild with `pnpm build-spotify`.

| Purpose | Path | Notes |
|---|---|---|
| Chapters (10) | `dist/acx-and-spotify/01-…` … `10-…mp3` | 192 kbps CBR, 44.1 kHz, mono |
| Retail sample | `dist/acx-and-spotify/retail-sample.mp3` | 4:58 — 14s credits + full Preface + 3:26 First Talk (works for both Spotify and ACX; see `ACX_PUBLISHING.md` for the build rationale) |
| Cover art | `dist/acx-and-spotify/cover.jpg` | 3000×3000, 1:1 |
| Chapter list | `dist/acx-and-spotify/chapters.csv` | titles + durations, to copy from |
| Build record | `dist/acx-and-spotify/upload-manifest.json` | exact chain + measured levels |

Total runtime **50m 21s**, 72.5 MB (chapters only — sample adds ~7 MB).

### Chapter order

| # | Title | Length |
|---|---|---|
| 1 | Plain Dharma | 1:45 |
| 2 | Preface | 1:18 |
| 3 | Chapter 1: The Buddha's First Talk (Dhammacakkappavattana Sutra) | 6:56 |
| 4 | Chapter 2: The Buddha's Second Talk (Anattalakkhana Sutra) | 5:16 |
| 5 | Chapter 3: The Buddha's Third Talk: The Fire Sermon (Adittapariyaya Sutra) | 4:48 |
| 6 | Chapter 4: On Loving-Kindness (Metta Sutra) | 3:18 |
| 7 | Chapter 5: The Foundations of Mindfulness (Satipatthana Sutra) | 18:10 |
| 8 | Chapter 6: How to Decide What to Believe (Kalama Sutra) | 6:38 |
| 9 | Closing | 0:26 |
| 10 | How This Book Was Made | 1:45 |

Ten chapters, not the M4B's 37 sections — a 16-second chapter looks broken in a
retail player. The Pali names in parentheses match the body text in
`dist/ebook/book.md`; the framing chapters (1, 2, 9, 10) have no Pali name and
keep their plain titles.

---

## Metadata

| Field | Value |
|---|---|
| Title | `Plain Dharma` |
| Subtitle | `The Buddha's Foundational Teachings in Modern English` |
| Author | `Gautama Buddha` |
| Contributor — Translator | `Claude Opus` |
| Contributor — Editor | `Alex Miller` |
| Narrator | `Digital voice — ElevenLabs "Theo Silk"` |
| Publisher | `Plain Dharma Press` |
| Language | English |
| Digital voice narration | **✅ CHECK THIS BOX** — see below |
| ISBN | *(leave blank — not required, and not auto-assigned)* |
| Categories | Religion & Spirituality → Buddhism → General |
| Price (USD) | `5.00` — see note |

The byline split matches KDP and ACX exactly: the teachings are the Buddha's,
the translation is Claude Opus's, the editing is Alex Miller's. Do not list
Alex as author, and never imply a human narrator.

### Digital voice narration — tick the box

Spotify appends a short disclosure line to the book's description when this is
set. That is the honest disclosure this project already commits to (see
`docs/architecture/` and the `/how-it-was-made` page); it is not a penalty, and
it is why this book can be on Spotify at all. The opening credits chapter
already says the translation was AI-assisted — it does **not** currently say the
*voice* is synthetic, so the metadata box is doing that work. Worth a re-record
of `src/content/en_tts/frontmatter.mdx` at some point to say it aloud.

### Price

`$5.00`. Matches the Kindle edition's $4.99. The free audiobook stays at
plaindharma.com — same arrangement as the paperback, which is paid on Amazon
while every format is free on the site. CC0 does not prohibit selling; the
retail listing is a convenience, not an enclosure.

### Description (paste verbatim — ~1,500 chars, well under Spotify's 2,000-char cap)

```
Six of the Buddha's foundational teachings, read aloud in plain modern English — clear enough to follow on a first listen, faithful enough to return to.

This is the same plain-English rendering as the book, but shaped for the ear. The voice is calm and unhurried, with pauses placed by hand so each teaching has room to land. No background music, no sound effects — just the words, the breath between them, and a slow pace meant for listening rather than skimming.

Inside (about 50 minutes):

1. The Buddha's First Talk — the middle path, the four noble truths, and the eightfold way to live.
2. The Buddha's Second Talk: Not-Self — why the body, feelings, perceptions, and even awareness aren't you.
3. The Fire Sermon — everything is on fire; what is burning, and how to cool down.
4. On Loving-Kindness — hold the wish that every living thing, without exception, be at ease.
5. The Foundations of Mindfulness — watch the body, feelings, mind, and experience clearly.
6. How to Decide What to Believe — don't take anything on authority; test it for yourself.

Each teaching opens and closes with a short framing, so you can listen straight through or pick one chapter at a time.

A note on how it was made: the plain-English rendering was drafted with AI from the original Pāli, then refined by hand — argued out line by line, word by word, against the 2,600-year-old text. The narration is a synthetic voice (ElevenLabs, "Theo Silk"), paced by a human editor. The full story is at plaindharma.com/how-it-was-made.

Released into the public domain under CC0 1.0. The text and audio are free in full at plaindharma.com; this retail edition is a paid convenience, with all proceeds supporting the project.
```

> **Adapted from the KDP copy, not reused.** The shared provenance story
> ("drafted with AI from the Pāli, refined by hand") is kept verbatim because
> it's the project's whole pitch — but the framing, the chapter intro, and the
> closing line are rewritten for an audio-listening audience (pacing, the
> synthetic-voice note, the paid-convenience framing). The KDP description
> leans on interior structure (illustrations, page count, Sources appendix)
> that an audiobook listener doesn't experience, so reusing it verbatim would
> sell something the audio can't deliver.

---

## Audio spec, and how to check it

Spotify wants 44.1 kHz, **192 kbps or higher**, peak at or below −3 dBFS, RMS
between −23 and −18 dBRMS, one file per chapter. Out-of-spec files are the most
common cause of a delayed or rejected submission.

`pnpm build-spotify` verifies every chapter against these numbers and refuses to
stay quiet about a miss — check its output for warnings before uploading. The
measured result of the current build: RMS −20.9 to −21.3, peaks −3.5 to −3.7,
chapter-to-chapter loudness spread 0.8 LU.

The mastering chain is `scripts/lib/master.ts`, shared with the site render so
every surface sounds identical. To verify tone after changing the shelf or the
compressor, the target is **−9.7 dB under 160 Hz relative to programme**:

```bash
ffmpeg -i FILE -af volumedetect -f null - 2>&1 | grep mean_volume
ffmpeg -i FILE -af "lowpass=f=160,lowpass=f=160,volumedetect" -f null - 2>&1 | grep mean_volume
```

## Known issues

Two sections have no usable master — `fire-sermon/02-the-same-fire-everywhere`
and `loving-kindness/00-title`, whose `candidates/orig-*` files are 1.250× and
1.283× their live cuts instead of the expected 1.2×. The build falls back to the
mastered site file for these, so the audio that ships is the audio that was
reviewed, and `build-spotify` warns about both on every run. Re-record them
deliberately, or refresh their masters, to clear the warnings.

## After it's live

Non-exclusive, so this does not affect the free downloads, the M4B, or any other
retailer. Processing is quoted at up to 72 hours. Audiobooks reach listeners in
22 markets including the US, UK, Canada, Ireland, Australia and New Zealand.

## Re-using these files for ACX

The same `dist/acx-and-spotify/` directory is the source for the ACX upload —
the chapter audio files are byte-identical between retailers, only the form
metadata differs. See `ACX_PUBLISHING.md` for the ACX-specific field-by-field
guide, including the policy citations for AI narration and the retail-sample
build rationale.
