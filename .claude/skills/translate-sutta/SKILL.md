---
name: translate-sutta
description: Full translation + audio narration pipeline for a Plain Dharma sutta. Translates Pali → plain modern Mandarin MDX, generates per-section TTS with the project's chosen voice, applies a 30% time-stretch for meditative pacing, patches the audio manifest, and cache-busts. Use when the user says "translate <slug>", "do the next sutta", or "rerun voice for <slug>".
argument-hint: "<slug> [<locale>] [--skip-translate] [--skip-audio] [--slow=N] [--voice=ID]"
allowed-tools: Bash, Read, Edit, Write, Agent
---

# Plain Dharma — Translate + Voice a Sutta

Takes a sutta slug whose EN MDX lives at `src/content/en/<slug>.mdx` and produces:

1. A plain-modern-Mandarin MDX at `src/content/zh/<slug>.mdx`, translated **from the Pali** (not from the EN), per the project's voice spec in `docs/translation-prompt-zh.md`.
2. ZH metadata updated (`SUTTA_DISPLAY.zh[slug]` in `src/content/index.ts`; optionally `DROPS.zh[slug]` in `src/content/drops.ts`).
3. A complete audio narration at `public/audio/zh/<slug>/` — title, preface (first-talk only), opening + body sections, drop — generated via ElevenLabs and time-stretched 30% slower for meditative pacing.
4. A patched manifest, normal-speed originals saved under `candidates/`, and cache-bust mtime bumps.

The skill is idempotent at the audio layer — re-running with `--skip-translate` will regenerate just the voice using the existing MDX.

## Defaults

| Parameter | Default | Override |
|---|---|---|
| locale | `zh` | second positional arg |
| voice | `bU2VfAdiOb2Gv2eZWlFq` (Carter) | `--voice=ID` |
| model | `eleven_multilingual_v2` | `--model=ID` |
| stability | `0.75` | `--stability=N` |
| style | `0.1` | `--style=N` |
| similarity | `0.75` | `--similarity=N` |
| slowdown | 30% (atempo=0.7692) | `--slow=N` → atempo = 1/(1+N/100) |

## Prerequisites

- `src/content/en/<slug>.mdx` exists.
- `ELEVEN_LABS_KEY` in `.env.local`.
- `ffmpeg` and `ffprobe` available on PATH.
- The slug is in `SUTTAS` in `src/content/index.ts`.
- For non-`first-talk` slugs: `src/content/zh_tts/<slug>-title.mdx` will be generated; `<slug>-drop.mdx` likewise. First-talk also needs `preface.mdx` (already exists).

## The six slugs and their Pali sources

```
first-talk       SN 56.11   Dhammacakkappavattana Sutta   (Chinese parallel: SĀ 379)
not-self         SN 22.59   Anattalakkhana Sutta          (Chinese parallel: SĀ 34)
fire-sermon      SN 35.28   Adittapariyaya Sutta          (Chinese parallel: SĀ 197)
loving-kindness  Snp 1.8    Metta Sutta                   (also Khp 9)
mindfulness      MN 10      Satipaṭṭhāna Sutta            (Chinese parallel: MĀ 98)
how-to-decide    AN 3.65    Kālāma Sutta
```

---

## Steps

### 1. Parse arguments

- First positional: slug (required).
- Second positional: locale (default `zh`).
- Flags: `--skip-translate`, `--skip-audio`, `--slow=N`, `--voice=ID`, `--model=ID`, `--stability=N`, `--style=N`, `--similarity=N`.
- Validate the slug is in `SUTTAS` (read `src/content/index.ts`).

### 2. Translation phase (skip if `--skip-translate`)

Spawn one Agent (general-purpose subagent) to translate. Its brief:

> You are translating <Pali sutta canonical name> (e.g. SN 56.11, Dhammacakkappavattana Sutta) from Pali into plain modern Mandarin for the Plain Dharma project at `/Users/fotoflo/dev/plain-dharma`.
>
> **System prompt:** Read `docs/translation-prompt-zh.md` in full. That is your translation specification — voice, register, vocabulary swaps, structural rules, what to avoid, worked examples. Follow it exactly.
>
> **Workflow:**
> 1. Read `docs/translation-prompt-zh.md` (your full spec).
> 2. Read `src/content/en/<slug>.mdx` for voice calibration and structural template.
> 3. Fetch the Pali on SuttaCentral (e.g. `https://suttacentral.net/<sutta-id>/pli/ms` for the Pali, `/en/sujato` and `/en/bodhi` for English cross-checks).
> 4. Cross-reference 2–3 scholarly English translations (Bhikkhu Sujato, Bhikkhu Bodhi, Thanissaro Bhikkhu at accesstoinsight.org).
> 5. Optionally check the Chinese Āgama parallel at cbeta.org — then deliberately depart from its liturgical register.
> 6. Write `src/content/zh/<slug>.mdx` (overwriting any placeholder), mirroring the EN MDX's structural elements (frontmatter, `##` headings, numbered lists, italic stage directions, `---` separators, blockquotes, em dashes).
>
> **Constraints:**
> - 简体中文, full-width Chinese punctuation (`，。「」？！——`).
> - No `比丘`/`世尊`/`如是我闻`/`三千大千世界`/`善哉` register **in the body**.
> - Proper names romanized (Kondañña, Varanasi, etc.).
> - Frontmatter: keep `slug`, `ordinal`, `pali_name` unchanged. Translate `title` and `subtitle`. The `title` is the project's editorial framing — plain modern, e.g. `佛陀的第一次开示`, NOT the canonical Chinese name. The canonical Chinese name goes in `kicker_override` (see post-translation metadata sync below).
> - Modify ONLY `src/content/zh/<slug>.mdx`.
>
> Report back with: title + subtitle you produced (for SUTTA_DISPLAY sync), the canonical Chinese name of this sutta (for `kicker_override`, e.g. `转法轮经` for first-talk), 5–8 judgment calls, and any places the Pali / scholarly translations / your output diverged.

After the agent returns, **sync the metadata** in `src/content/index.ts` `SUTTA_DISPLAY.zh[slug]`:

- `title` — plain modern editorial title from the MDX frontmatter (e.g. `佛陀的第一次开示`).
- `subtitle` — matches the MDX frontmatter subtitle.
- `teaser` — short punchy one-liner; if still lorem-ipsum, rewrite from `SUTTA_DISPLAY.en[slug].teaser` in plain-modern Mandarin (typically `8-15` characters).
- `kicker_override` — the canonical Chinese name in the locale's traditional register (e.g. `转法轮经`, `无我相经`, `燃烧经`, `慈经`, `念处经`, `卡拉玛经`). This is the **one place** in the user-facing copy where traditional Chinese Buddhist register is correct and expected — it parallels how EN uses the Pali name in the kicker. Set `kicker_override` to the well-known traditional name; leave it unset only if no such name exists for the locale.

The kicker is rendered as `meta.kicker_override ?? meta.pali_name` in `HomeView`, `SuttaView`, and `ReadView`. Setting `kicker_override` swaps the yellow kicker text without affecting any other display surface.

Edit `src/content/drops.ts` if `DROPS.zh[slug]` is still a lorem-ipsum placeholder — write a one-line punchy drop in the project's editorial voice (read `DROPS.en[slug]` for reference; render it plain-modern, not 文言).

Run `pnpm tsc --noEmit` to confirm types still satisfy.

### 3. Audio phase (skip if `--skip-audio`)

Voice setup variables:

```bash
VID=bU2VfAdiOb2Gv2eZWlFq          # override with --voice=
MODEL=eleven_multilingual_v2       # override with --model=
STAB=0.75                          # override with --stability=
STYLE=0.1                          # override with --style=
SIM=0.75                           # override with --similarity=
SLOW=30                            # percent slowdown; override with --slow=
ATEMPO=$(python3 -c "print(round(1/(1+${SLOW}/100), 4))")  # e.g. 0.7692 for 30%
```

#### 3a. Create TTS source MDX files

If they don't already exist:

- `src/content/zh_tts/<slug>-title.mdx` — a 3-line title slate that mirrors the visible kicker → title → subtitle hierarchy:
  ```mdx
  ---
  slug: <slug>-title
  tts_mirror: true
  ---

  <kicker_override>。

  <ZH title>。

  <first sentence of ZH subtitle — descriptive only, drop any editorial-note tail>。
  ```

  **Do NOT include the Pali name in the spoken title slate for ZH.** The Chinese voice (Carter, Hardy, etc.) mispronounces Pali transliterations like "Dhammacakkappavattana" awkwardly — they fall outside Mandarin phonology and break the meditative flow. The spoken slate uses Chinese-only: canonical Chinese name (kicker) + plain modern title + descriptive subtitle. This also matches what the listener sees on screen.

  For locales whose voice handles Pali gracefully (e.g. English narration, or some Indian-language voices), the EN-style three-line slate with the Pali first IS appropriate — see `src/content/en_tts/<slug>-title.mdx` for reference.
- `src/content/zh_tts/<slug>-drop.mdx` — the editorial drop one-liner. Body is `DROPS.zh[slug]` text.
- `src/content/zh_tts/preface.mdx` — only for first-talk (already exists).
- `src/content/zh_tts/voice-prompt.txt` — required by the script (already exists, used as a no-op placeholder for ElevenLabs).

#### 3b. Generate audio (sequential — manifest mirror races if parallelized)

```bash
SETTINGS="--provider=elevenlabs --voiceId=$VID --model=$MODEL --stability=$STAB --style=$STYLE --similarity=$SIM"

# Title slate
pnpm generate-audio <slug>-title <locale> $SETTINGS

# Preface (first-talk only)
if [ "$SLUG" = "first-talk" ]; then
  pnpm generate-audio preface <locale> $SETTINGS
fi

# Body sections — one --section per `##` heading in the MDX, plus the implicit opening.
# Read src/content/<locale>/<slug>.mdx and extract `##` heading text for each section ID.
# Then for each section (including "opening"):
pnpm generate-audio <slug> <locale> $SETTINGS --section=<section-id>

# Drop
pnpm generate-audio <slug>-drop <locale> $SETTINGS
```

The script writes to `public/audio/<locale>_tts/<slug-or-helper>/01-opening.mp3` (for single-section helper MDX) or `public/audio/<locale>/<slug>/0N-<section-id>.mp3` for body sections (also mirrors directly into the live dir for the body case). For helper-MDX runs (title / preface / drop), the file lands in a sibling directory and must be moved into the `<slug>` directory with the correct filename.

#### 3c. Save normal-speed originals + apply 30% slowdown

```bash
cd public/audio/<locale>/<slug>
mkdir -p candidates

# Save normal-speed originals (move-or-copy depending on whether the file is a
# direct mirror or sits in a sibling dir).
cp ../<slug>-title/01-opening.mp3 candidates/title-carter.mp3
[ -d ../preface ] && cp ../preface/01-opening.mp3 candidates/preface-carter.mp3
cp 02-<section1>.mp3 candidates/<section1>-carter.mp3
# ... repeat for each body section ...
cp ../<slug>-drop/01-opening.mp3 candidates/drop-carter.mp3

# Apply 30% slowdown into final positions.
ffmpeg -hide_banner -loglevel error -i candidates/title-carter.mp3 -filter:a atempo=$ATEMPO -y 00-title.mp3
[ -f candidates/preface-carter.mp3 ] && ffmpeg -hide_banner -loglevel error -i candidates/preface-carter.mp3 -filter:a atempo=$ATEMPO -y 00b-preface.mp3
ffmpeg -hide_banner -loglevel error -i candidates/<section1>-carter.mp3 -filter:a atempo=$ATEMPO -y 02-<section1>.mp3
# ... repeat ...
ffmpeg -hide_banner -loglevel error -i candidates/drop-carter.mp3 -filter:a atempo=$ATEMPO -y 99-drop.mp3

# Mirror slowed versions to staging (zh_tts/).
cp 0*.mp3 99-drop.mp3 ../../<locale>_tts/<slug>/

# Clean up helper-MDX staging dirs.
rm -rf ../<slug>-title ../<slug>-drop ../../<locale>_tts/<slug>-title ../../<locale>_tts/<slug>-drop
[ -d ../preface ] && rm -rf ../preface ../../<locale>_tts/preface
```

The opening section (`01-opening.mp3`) is already in place from the body-section run; ffmpeg-slow it the same way.

#### 3d. Get final durations and write the manifest

```bash
for f in 00-title.mp3 00b-preface.mp3 01-opening.mp3 02-*.mp3 03-*.mp3 04-*.mp3 99-drop.mp3; do
  [ -f "$f" ] && ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$f"
done
```

Write `manifest.json` with:
- `slug`, `locale`, `voice` (= `$VID`), `model`, `generated_at` (now ISO),
- `sections` in order: `title`, `preface` (first-talk only), `opening`, one per body `##` heading (using its Chinese heading text as the section `id` and `title`), `drop`.

Each section: `{ id, title, file, duration_sec }`.

#### 3e. Cache-bust

```bash
find public/audio/<locale>/<slug> -maxdepth 1 -type f -exec touch {} \;
rm -rf .next
```

The audio.ts module appends `?v=<mtime-seconds>` to every audio URL, so bumping mtimes is sufficient to force a browser re-fetch.

### 4. Verify

```bash
pnpm tsc --noEmit
pnpm build  # confirms /zh/<slug> route still generates
```

Confirm 36 routes generate including the ZH one. Open `/zh/<slug>` in dev or hard-reload to listen.

### 5. Don't auto-commit

This skill produces large binary mp3 files. Surface them to the user with `git status --short | head` so they can review and commit themselves.

---

## Known patterns & gotchas

- **Title vs kicker division of labor.** The H1 (`SUTTA_DISPLAY.<locale>.title` and the MDX frontmatter `title`) is the project's plain-modern editorial framing (e.g. `佛陀的第一次开示`, "The Buddha's First Talk") — never the canonical scholarly name. The canonical name (e.g. `转法轮经`, `Dhammacakkappavattana Sutta`) goes in the kicker slot above the title. For locales that need a non-Pali kicker, set `SUTTA_DISPLAY.<locale>.<slug>.kicker_override` — views fall back to `pali_name` when unset. This is the only place in user-facing copy where traditional Buddhist liturgical register is appropriate; body prose, drops, and editorial titles all stay plain modern.
- **Title slate audio mirrors the visible kicker → title flow**, not the EN three-line "Pali / project title / subtitle" template. For ZH, drop the Pali line — Mandarin TTS voices mispronounce Pali transliterations awkwardly. Slate is: `<canonical Chinese name>。 <plain modern title>。 <descriptive subtitle>。`.
- **Section IDs for ZH body** come from the Chinese `##` heading text directly (e.g. `02-四个真相.mp3`). The `toKebabCase` function in `scripts/generate-audio.ts` preserves CJK Unified Ideographs (`一-鿿` and Extension A `㐀-䶿`); if it ever stops doing that, all body section files collide to `02-.mp3`.
- **Manifest mirror races.** The body-section generations write to the same `public/audio/<locale>/<slug>/manifest.json` via the script's mirror logic. Run body sections sequentially, never in parallel. Title / preface / drop generations use different slugs and are safe to parallelize with each other but the speedup isn't worth the orchestration complexity.
- **The `voice` field** in the manifest is metadata only — per-section voice attribution isn't tracked. Set it to the dominant body voice.
- **The `instructions` voice prompt** at `src/content/<locale>_tts/voice-prompt.txt` is loaded but not actually sent to ElevenLabs (only OpenAI). Keep it for documentation / aspirational purposes; the script bails if it's missing.
- **v2 model strips audio tags** like `[long pause]`. Anything bracketed in section text is removed before the API call. If you need explicit pauses, use plain punctuation (`。`) or switch to `--model=eleven_v3`.
- **30% slowdown** is the project's chosen meditative pace, applied to the *original-speed* TTS output in a single ffmpeg pass (atempo=0.7692). Don't compound multiple atempo passes — quality degrades. If the user asks for "10% more" while a 30% slow is live, recompute atempo against the original (`atempo = 1/(1.3 × 1.1) = 0.6993`).
- **Candidates directory** is a per-sutta scratch space for voice auditions and pre-slowdown originals. Each candidate file should be ~5 MB; total per sutta is ~30 MB. Don't .gitignore — they're useful for re-experimenting with slowdown without paying the TTS API again.

## Voice library cheat sheet

Voices the project has auditioned (all on `eleven_multilingual_v2`):

| Name | Voice ID | Use |
|---|---|---|
| **Carter** | `bU2VfAdiOb2Gv2eZWlFq` | **Current narrator — all sections** |
| Hardy (Taiwanese) | `FS8UtxyDrvYcNCxVaziq` | tried for title + preface, replaced by Carter |
| Haoran | `pU9NaAwkoR3v0Mrg3uKz` | initial body voice, replaced by Carter |
| Aliby | `qwKjxMVO8wNg6qaKKH1k` | auditioned for opening, not chosen |

If the user introduces a new voice, audition just the opening section first:

```bash
pnpm generate-audio first-talk <locale> --provider=elevenlabs --voiceId=<NEW> --model=eleven_multilingual_v2 --section=opening --stability=0.75 --style=0.1
cp public/audio/<locale>/first-talk/01-opening.mp3 public/audio/<locale>/first-talk/candidates/opening-<voicename>.mp3
```

Then revert to the current narrator if the audition doesn't win.
