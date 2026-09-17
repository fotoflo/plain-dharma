# ACX / Audible Publishing — Plain Dharma audiobook

Field-by-field inputs for the Audible ACX audiobook submission, ordered to match
the upload flow. Companion to `SPOTIFY.md`; same audio files, same chapter
structure, same byline. Audio assets live in a single shared build directory:
**`dist/acx-and-spotify/`**, produced by `pnpm build-spotify`.

Portal: <https://www.acx.com/> → **Audiobook** → *Add a New Title* → *Upload*

---

## Status as of 18 Sep 2026

The previous ACX title (`A1WCYS5HNLRGZG`, contract `A60Q4CVL0OQV6`) was
**terminated at our request** on 18 Sep 2026 ("As requested by you, the
Producer, or both parties, the ACX production for Plain Dharma has been
terminated"). The §2(a) exclusive-distribution conflict with CC0 is gone —
Spotify and the free M4B on plaindharma.com are no longer in breach, and the
new ACX submission proceeds at the **30% non-exclusive royalty rate**.

AI narration was previously prohibited by ACX's submission requirements
("Unauthorized use of text-to-speech, AI, or automated recordings in ACX
titles is prohibited"). **As of 18 Sep 2026, ACX accepts AI-narrated
submissions with disclosure** (verified live in the upload form; the policy
text you supplied: AI narration is permitted, the narrator field accepts a
disclosure string, and the existing AI-disclosure checkboxes in the form
cover the requirement). ⚠️ **NEEDS CITATION**: paste the verbatim current
policy text into this section before relying on it as the canonical source.

---

## Files to upload (already built, in `dist/acx-and-spotify/`)

Rebuild with `pnpm build-spotify`.

| Purpose | Path | Notes |
|---|---|---|
| Chapters (10) | `dist/acx-and-spotify/01-…mp3` … `10-…mp3` | 192 kbps CBR, 44.1 kHz, mono |
| Retail sample | `dist/acx-and-spotify/retail-sample.mp3` | 4:58 — see "Retail sample" below |
| Cover art | `dist/acx-and-spotify/cover.jpg` | 3000×3000, 1:1 (same as Spotify) |
| Chapter list | `dist/acx-and-spotify/chapters.csv` | titles + durations, to copy from |
| Build record | `dist/acx-and-spotify/upload-manifest.json` | exact chain + measured levels |

Total chapter runtime **50m 21s**, ~72.5 MB. Retail sample adds ~7 MB.

---

## Retail sample

**Use `dist/acx-and-spotify/retail-sample.mp3` as uploaded — do not cut or
rebuild.** It's already built to ACX spec by `pnpm build-spotify`.

### What's in it

| Segment | Duration | Lands on |
|---|---|---|
| `01-plain-dharma.mp3` (first 14s) | 14s | *"…translated by Claude Opus, edited by Alex Miller."* |
| `02-preface.mp3` (full) | 1:18 | *"Their resolve melted before he said a word."* |
| `03-1-the-buddha-s-first-talk.mp3` (first 3:26) | 3:26 | mid-paragraph |
| **Total** | **4:58** | within ACX's 1–5 min spec |

### Why this composition

ACX best-practices guidance (verbatim, 18 Sep 2026): *"No Credits or Music:
Avoid putting opening credits, intro music, or copyright statements in the
sample."* The 14s credits head is the minimum cut that still preserves the
project's headline provenance claim — title + subtitle + the byline
*"translated by Claude Opus, edited by Alex Miller."* The full credits chapter
(1:45) is omitted from the sample because the second-paragraph AI-narration
disclosure is not the load-bearing signal in a 4:58 sample; that work is done
by the Summary field's AI-narration line, the Narrator field's disclosure
string, and the AI-narration checkbox on later form screens.

The seam between Preface end (*"…before he said a word"*) and First Talk
start (*"At Varanasi, in the deer park at Isipatana…"*) lands on the same
scene in the same location — the deer park near Varanasi. No crossfade is
needed because both halves already share a setting; the narrative carries
the transition.

The retail sample is a **standalone file** — it is not stitched into the
full audiobook on purchase. Buyers who finish the sample and click buy get
the full audiobook from Chapter 1 (the full 1:45 opening credits chapter)
forward, so the disclosure is preserved on purchase.

### Audio spec verification

```
ffprobe -v error -show_entries format=duration,bit_rate \
  -show_entries stream=codec_name,sample_rate,channels,bit_rate \
  dist/acx-and-spotify/retail-sample.mp3
```

Expected: `codec_name=mp3, sample_rate=44100, channels=1, bit_rate=192000,
duration≈298.14` (= 4:58.14).

---

## Chapter order (paste into ACX's chapter-naming screen)

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

> **Leave the ACX chapter-naming field blank on this screen.** ACX auto-detects
> chapter boundaries from the uploaded file names. Typing chapter names here
> creates a drift risk (typos in this form create chapter breaks that don't
> match the audio). The table above is for reference only — paste it into
> Audible's landing-page chapter list later if needed.

Ten chapters, not the M4B's 37 sections — a 16-second chapter looks broken in
a retail player. Pali names match the body text in `dist/ebook/book.md`;
framing chapters (1, 2, 9, 10) have no Pali name.

---

## Metadata (Screen 1 — Audiobook Details)

| Field | Value |
|---|---|
| Title | `Plain Dharma` |
| Subtitle | `The Buddha's Foundational Teachings in Modern English` |
| Author | `Gautama Buddha` |
| Contributor — Translator | `Claude Opus` |
| Contributor — Editor | `Alex Miller` |
| Narrator(s) | `Digital voice (ElevenLabs "Theo Silk"); produced by Alex Miller` |
| Publisher(s) | `Plain Dharma Press` |
| Language | English |
| Audiobook type | Non-exclusive (see "Distribution" below) |
| Categories | Religion & Spirituality → Buddhism |
| Genre | Religion & Spirituality |
| Format | Unabridged |
| Retail price (USD) | `5.00` |
| Copyright year (audio) | `2026` |
| Copyright owner (audio) | `Plain Dharma Press` |

The byline split matches KDP and Spotify exactly. Do not list Alex as author,
and never imply a human narrator. The Narrator field is a free-text
comma-separated list — paste the disclosure string verbatim.

### Summary (~1,500 chars, well under ACX's 2,000-char cap)

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
> sell something the audio can't deliver. Same as the Spotify summary.

### Digital voice narration — disclosure requirement

ACX accepts AI-narrated submissions with a disclosure string in the Narrator
field. The string already includes the disclosure: *"Digital voice (ElevenLabs
'Theo Silk'); produced by Alex Miller."* Watch for an AI-narration checkbox
on later form screens — if present, tick it. ⚠️ **NEEDS VERIFICATION**: the
exact field name and label should be confirmed against the current ACX form
during upload; paste the verbatim field text into this section for future
uploaders.

### Retail price

`$5.00`. Matches the Kindle edition's $4.99 and the Spotify edition's $5.00.
The free audiobook stays at plaindharma.com — same arrangement as the
paperback. CC0 does not prohibit selling; the retail listing is a
convenience, not an enclosure.

---

## Distribution

**Non-exclusive, 30% royalty.** This is the right choice for *Plain Dharma*
because:

- We already distribute the same audio on Spotify (non-exclusive) and on the
  free site (`/download`). Exclusive distribution would forbid both.
- ACX non-exclusive 30% is the standard rate when you're distributing the
  same audiobook elsewhere — it costs nothing to take and unlocks Audible,
  Amazon, and Apple Books reach.
- ⚠️ **CONFIRM at upload**: ACX may prompt for a "rights confirmation"
  acknowledging non-exclusive distribution. Paste: *"This audiobook is also
  distributed on Spotify for Authors (non-exclusive to Spotify's terms) and
  is freely available in audio format at plaindharma.com under CC0 1.0.
  Submitting under non-exclusive terms to avoid §2(a) conflict with the CC0
  grant."*

---

## Audio spec, and how to check it

ACX wants 44.1 kHz, **192 kbps or higher**, peak at or below −3 dBFS, RMS
between −23 and −18 dBRMS, noise floor at or below −60 dB, one file per
chapter.

`pnpm build-spotify` verifies every chapter against these numbers and refuses
to stay quiet about a miss — check its output for warnings before uploading.
The measured result of the current build: RMS −20.9 to −21.2 inside the
−23 to −18 band, peaks at −3.5 to −3.7, chapter-to-chapter loudness spread
0.4 LU.

The mastering chain is `scripts/lib/master.ts`, shared with the site render
and the Spotify build, so every surface sounds identical. To verify tone
after changing the shelf or the compressor, the target is **−9.7 dB under
160 Hz relative to programme**:

```bash
ffmpeg -i FILE -af volumedetect -f null - 2>&1 | grep mean_volume
ffmpeg -i FILE -af "lowpass=f=160,lowpass=f=160,volumedetect" -f null - 2>&1 | grep mean_volume
```

### Tempo

The audiobook is delivered at **−20% atempo** (meditative pace, `atempo≈
0.8333`, duration ×1.2). This is the project's signature narration style and
matches the live site files. ACX's QC checks RMS / peak / noise floor, not
tempo, so it passes technical review. Reviewers may notice the slow pace
but will not reject for it.

---

## Known issues

Two sections have no usable master — `fire-sermon/02-the-same-fire-everywhere`
and `loving-kindness/00-title`, whose `candidates/orig-*` files are 1.250×
and 1.283× their live cuts instead of the expected 1.2×. The build falls
back to the mastered site file for these, so the audio that ships is the
audio that was reviewed, and `build-spotify` warns about both on every run.
Re-record them deliberately, or refresh their masters, to clear the
warnings.

---

## After it's live

Non-exclusive, so this does not affect the free downloads, the M4B, Spotify,
or any other retailer. Processing is quoted at up to 72 hours. Audiobooks
reach listeners in 22 markets including the US, UK, Canada, Ireland,
Australia and New Zealand.

For the first 30 days, watch the Audible listing for any QC flags (the
retail sample and the first chapter are the most commonly flagged). If
ACX rejects with a peak or RMS warning, the fix is to re-run `pnpm
build-spotify` after tightening the limiter in `scripts/lib/master.ts`;
do not re-encode from the existing `dist/acx-and-spotify/` files.

---

## Reference: prior ACX contract (terminated 18 Sep 2026)

For historical context, the prior ACX title (`A1WCYS5HNLRGZG`, contract
`A60Q4CVL0OQV6`) was accepted on Exclusive distribution, worldwide. ACX
agreement v3.1 had:

- **§2(a)** — exclusive distribution conflicts with CC0 (the audiobook is
  also free on plaindharma.com, and CC0 is irrevocable).
- **§2(c)** — switching to non-exclusive required 90 days on sale first;
  moot once the contract was terminated.
- **§2(d)** — termination: what we actually used. Required 90 days on sale
  first under v3.1; ACX accepted our termination request on 18 Sep 2026
  regardless, possibly because the audio was never delivered
  (delivery starts the 90-day clock).

The full §-by-§ breakdown lives in `KDP_PUBLISHING.md` → "The ACX contract
conflicts with CC0" (kept for historical record; the operative section now
is "Audiobook: Audible is blocked, but not for the reason first recorded"
which should be updated once the new policy citation is added here).
