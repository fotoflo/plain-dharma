# KDP Publishing Guide — Plain Dharma

Field-by-field inputs for Amazon Kindle Direct Publishing, ordered to match KDP's
own form screens. Hand this to a browser agent (or follow it manually) to fill the
forms. Values marked **⚠️ DECIDE** are judgment calls you must confirm — they are
not auto-fillable safely.

Account / start: <https://kdp.amazon.com/en_US/bookshelf>
→ **+ Create** → choose **Kindle eBook** (Product A) or **Paperback** (Product B).

---

## Files to upload (already built, in `dist/`)

| Purpose | Path | Notes |
|---|---|---|
| eBook manuscript | `dist/ebook/plain-dharma.epub` | EPUB 3, cover + CC0 page already embedded |
| eBook cover art (front) | `dist/ebook/cover-kindle.jpg` | 1600×2560 (Kindle's ideal 1.6:1), cream-padded, carries the "translated by Claude Opus, edited by Alex Miller" byline — for the **Kindle** edition. (`cover.jpg` is the unpadded 6×9 used by the PDF cover page, EPUB interior, and audiobook art.) |
| Paperback interior (color) | `dist/kdp/plain-dharma-kdp-interior-color.pdf` | 48 pp, 5.25"×8.25" (5×8 + bleed), **cover-free**, cream bg |
| Paperback interior (B&W, cheaper) | `dist/kdp/plain-dharma-kdp-interior-bw.pdf` | 48 pp, grayscale, white paper, **cover-free** |
| Paperback wraparound cover (color) | `dist/kdp/plain-dharma-kdp-cover-color.pdf` | 10.35×8.25, back+spine+front, spine 0.108", barcode = print ISBN ‑38‑1 |
| Paperback wraparound cover (B&W interior) | `dist/kdp/plain-dharma-kdp-cover-bw.pdf` | same art, spine 0.113" (groundwood caliper) — match to the B&W interior |

If you edited any content, rebuild first:
`pnpm build-ebook && pnpm generate-front-cover && pnpm generate-back-cover && pnpm build-kdp`
(or just `pnpm build-all`). The 5×8 paperback now ships a complete **wraparound**
cover PDF — you no longer need KDP Cover Creator. Use the **`dist/kdp/`** files for
the paperback; the older `dist/print/*` 5×8 PDFs embed the back cover as an interior
page and are NOT for KDP upload.

---

# PRODUCT A — Kindle eBook

## Screen 1 — Kindle eBook Details

| Field | Value |
|---|---|
| Language | English |
| Book Title | `Plain Dharma` |
| Subtitle | `The Buddha's Foundational Teachings in Modern English` |
| Series | *(leave blank)* |
| Edition number | `1` |
| Primary Author or Contributor — First | `Gautama` |
| Primary Author or Contributor — Last | `Buddha` |
| Contributors → role `Translator` | `Claude` / `Opus` |
| Contributors → role `Editor` | `Alex` / `Miller` |
| Description | *(paste the block below)* |

> **Byline / credit — read before filling these fields.** KDP's primary field is
> labelled **"Primary Author *or* Contributor"** — you are **not** forced to call
> yourself the author, and the Contributors section has a **role dropdown**
> (Translator, Editor, …). So enter the source attribution **Gautama Buddha** as the
> primary name, add **Claude Opus** as a **Translator** contributor, and add
> **Alex Miller** as an **Editor** contributor. This is the honest split — Claude
> Opus produced the translation, Alex edited it line by line — keeps you from
> overstating your relationship to 2,600-year-old suttas, and clarifies the rights
> story: the *teachings* are public-domain (Buddha) and the whole edition is released
> CC0 (the rights answer below). **Do not check "Author"** for Alex. "Gautama Buddha"
> is also a real Amazon author entity, which helps discoverability. The resulting
> byline reads "Gautama Buddha · Translated by Claude Opus · Edited by Alex Miller".
| Publishing rights | **⚠️ DECIDE** — see "Publishing rights" note below |
| Primary audience — Sexually explicit images | No |
| Reading age | *(leave blank)* |
| Primary marketplace | Amazon.com |
| Categories | *(pick 3 — see list below)* |
| Keywords | *(7 slots — see list below)* |
| Pre-order | Release my book for sale now |

### Description (paste verbatim — ~2,200 chars, KDP allows 4,000)

```
Six of the Buddha's foundational teachings, rendered in plain modern English — clear enough to read in an afternoon, faithful enough to take seriously.

This is not a scholarly translation bristling with Pali and footnotes. It is a plain reading: the same teachings working scholars have translated for decades, set down in everyday language so a first-time reader can actually follow them — without watering down the substance.

Inside:

1. The Buddha's First Talk (Dhammacakkappavattana) — the middle path, the four noble truths, and the eightfold way to live.
2. The Buddha's Second Talk: Not-Self (Anattalakkhana) — why the body, feelings, perceptions, and even awareness aren't you.
3. The Fire Sermon (Adittapariyaya) — everything is on fire; what is burning, and how to cool down.
4. On Loving-Kindness (Metta) — hold the wish that every living thing, without exception, be at ease.
5. The Foundations of Mindfulness (Satipatthana) — watch the body, feelings, mind, and experience clearly.
6. How to Decide What to Believe (Kalama) — don't take anything on authority; test it for yourself.

Each teaching opens with a one-line distillation and a simple illustration, and the book closes with a Sources & Further Reading appendix pointing to the rigorous scholarly translations (SuttaCentral, Access to Insight, Bhikkhu Bodhi) behind every plain-English rendering.

Released into the public domain under CC0 1.0. Copy it, print it, translate it, give it away — no permission needed, no attribution required, in keeping with the Buddhist tradition of free dharma distribution. Every format lives free at plaindharma.com.

A note on how it was made: the plain-English rendering was drafted with AI from the original Pāli, then refined by hand — argued out line by line, word by word, against the 2,600-year-old text. The full story is at plaindharma.com/how-it-was-made.
```

### Categories (choose 3 from KDP's browse tree)

- Religion & Spirituality › Buddhism › Sacred Writings
- Religion & Spirituality › Buddhism › Theravada
- Religion & Spirituality › Buddhism › Rituals & Practice

### Keywords (7 slots, one phrase each)

1. `buddhist suttas plain english`
2. `pali canon teachings`
3. `buddhism for beginners`
4. `four noble truths`
5. `mindfulness satipatthana`
6. `loving kindness metta`
7. `public domain dharma`

## Screen 2 — Kindle eBook Content

| Field | Value |
|---|---|
| Manuscript | Upload `dist/ebook/plain-dharma.epub` |
| Book Cover | "Upload a cover you already have" → `dist/ebook/cover-kindle.jpg` (1.6:1, byline) |
| AI Content disclosure | **⚠️ DECIDE** — see "AI content" note below |
| Kindle eBook ISBN | *(leave blank — not required for Kindle)* |
| Preview | Open Previewer, page through, confirm TOC + cover render |

## Screen 3 — Kindle eBook Pricing

| Field | Value |
|---|---|
| KDP Select enrollment | **No / unchecked** — see note (exclusivity conflicts with the free site) |
| Territories | All territories (worldwide rights) |
| Primary marketplace | Amazon.com |
| Royalty plan | 70% |
| List price (USD) | `4.99` |
| Other marketplaces | Let KDP auto-convert from USD |
| Book Lending | Allow (checked) |

> **Why 70% / $4.99:** $4.99 sits inside Amazon's 70% royalty band ($2.99–$9.99),
> so it earns the good rate (~$3.40/sale). The book is short, so $4.99 is the
> honest ceiling — the value story is the *rendering from the Pāli*, not page
> count. The original plain-English rendering is your own copyrightable work, so
> the public-domain 35%/rejection rule does **not** apply. The free version is the
> PDF/audiobook + web reading on plaindharma.com — the Kindle file is the paid
> edition (the free in-app EPUB has been removed). See `BOWKER_REVIEW.md` and the
> pricing research in `docs/todos.md`.

---

# PRODUCT B — Paperback

Create it from the **same title** so KDP links the Kindle + paperback editions
(open the eBook on your Bookshelf → "Create Paperback").

## Screen 1 — Paperback Details

Same as Kindle Screen 1: Language `English`, Title `Plain Dharma`, Subtitle
`The Buddha's Foundational Teachings in Modern English`, primary name
`Gautama` / `Buddha` with `Claude` / `Opus` as a **Translator** contributor and
`Alex` / `Miller` as an **Editor** contributor (see the Byline note in Product A),
the same Description, Categories, and Keywords, and the
same **⚠️ DECIDE** Publishing-rights choice.

> **First paperback (ISBN …-38-1) shipped with the wrong byline — superseded.**
> The Kindle edition is correct: primary `Gautama Buddha`, `Claude Opus` as
> Translator, `Alex Miller` as Editor. The **first paperback's primary Author field
> locked at `Alex Miller`**: KDP only allows that field to be edited within **72
> hours of publication**, and it went live 9 Jun 2026. The form greys it out and says
> changes require publishing a new edition.
>
> **Decision (Sep 2026): publish the new edition.** The ISBN is available from
> Ellen's `978-1-891328` block, and the old listing had 6 sales and **zero reviews**,
> so there is nothing to preserve — and the cost only rises with every future sale.
> The provenance story is the launch pitch, so the Amazon byline has to match it.
>
> **KDP support was asked, and refused** (6 Sep 2026, agent Wydaad, case
> `500at00000eRYkyAAG` — the chat auto-closed on inactivity, so follow-ups start a
> **new** chat that references the case rather than resuming this one).
> The agent confirmed the paperback's metadata is locked, declined twice, and did
> not escalate to a catalog team. Do not re-litigate this; the answer was clear.
>
> **Support did confirm the safe sequence, in writing:** *"We will link the books for
> you Alex, yes you can publish the new book and then unpublish the old book — once
> done you have to contact us so we can link the books."* So publish the replacement
> **first**, unpublish ASIN `1891328387` **second**, then re-open case
> `500at00000eRYkyAAG` to request the linking. That leaves no gap on Amazon and
> carries reviews and sales history across. Never unpublish before the replacement
> is live — removal takes ~72h and does nothing to speed up the new listing.
>
> **New-edition checklist:**
>
> 1. Get the new ISBN from Ellen and register it with Bowker (mirror the ONIX record
>    in `BOWKER_REVIEW.md`). Use the assigned digits **verbatim** — the EAN-13 check
>    digit is not guessable from the previous number.
> 2. Update `PRINT_ISBN` in `scripts/render-covers.ts`, plus the references in this
>    file, `BOWKER_REVIEW.md`, and `src/app/api/private/fill-sheet.ts`.
> 3. `pnpm render-covers && pnpm build-kdp` — the back-cover barcode is generated
>    from the ISBN string, so the wraparound rebuilds itself. Interior is unchanged
>    at 48pp, so the spine width is unchanged.
> 4. In KDP, use **"+ Create new title or series" → Paperback** at the top of the
>    Bookshelf. There is no "new edition" button, and no "+ Create paperback" on the
>    existing title because that format slot is taken — it must be a standalone
>    title. **Do not take a free KDP ISBN** (not portable; lists Amazon as
>    publisher, which breaks the Plain Dharma Press imprint). Then
>    set primary `Gautama` / `Buddha` on Screen 1, with `Claude` / `Opus` as
>    Translator and `Alex` / `Miller` as Editor. Keep **title, subtitle, description,
>    categories, and keywords byte-identical** to the old listing — the linking
>    request depends on the two reading as the same book. KDP does **not** enforce
>    title uniqueness (different ISBNs are different products), but publishing
>    before unpublishing means two live paperbacks with identical details, which
>    can trip the **duplicate-content check** in review. If it flags, reply citing
>    case `500at00000eRYkyAAG` — support authorized this republish-under-new-ISBN
>    to correct locked metadata, and that chat is the authorization trail.
>    **⚠️ DECIDE at this step — list price.** The old paperback listed at `$9.99`;
>    the Screen 3 guidance below says to set the lowest price KDP allows so it
>    just covers printing (~$4–6 for 48pp at 5×8). This was never settled. Pick
>    one here and make the Bowker record match.
> 5. **Verify the live byline within 72 hours of publication.** The field re-locks
>    after that window — this is exactly how the first paperback went wrong.
> 6. Once the new listing is live, two **separate** operations:
>    - **Format link** (new paperback ↔ Kindle `B0H4W4TVGM`) — Amazon auto-links when
>      book details match across formats, and the Bookshelf has a manual link tool.
>      Self-serve. See <https://kdp.amazon.com/help/topic/G200652220>.
>    - **Edition merge** (old `1891328387` → new paperback, to carry reviews and sales
>      history) — **support only**, via case `500at00000eRYkyAAG`. The Bookshelf link
>      tool does not do this.
>
>    Unpublish ISBN …-38-1 before requesting the merge.

## Screen 2 — Paperback Content

| Field | Value |
|---|---|
| ISBN | Use your own Bowker ISBN: **`978-1-891328-39-8`** (the *replacement* paperback edition, registered with Bowker 6 Sep 2026; `…-38-1` is the retired first paperback and `…-37-4` is the ebook). Choose "I have my own ISBN" and enter it; do **not** take a free KDP ISBN (the free one isn't portable to other printers). |
| Publication date | *(leave blank — uses approval date)* |
| Print — Ink & Paper | **Black & white interior with cream paper** — the shipping choice, and what …-38-1 used (Amazon lists it as 5 x 0.12 x 8 in, and only cream's caliper gives a 0.12" spine at 48pp). Built by the **bw** variant. Groundwood is the cheaper alternative (~15% lower CO2, B&W-only) — switch `CALIPER` + `backCover` in `build-kdp.ts` to use it. The **color** variant is premium color on white, spine 0.108". |
| Trim size | 5 x 8 in |
| Bleed | **Bleed (PDF has bleed)** — interiors are 5.25"×8.25" |
| Cover finish | Matte |
| Manuscript | Upload `dist/kdp/plain-dharma-kdp-interior-color.pdf` (or `-bw.pdf` to match the paper choice above) — these are **cover-free**, as KDP requires |
| Book Cover | "Upload a print-ready PDF (recommended)" → `dist/kdp/plain-dharma-kdp-cover-color.pdf` (use `-bw.pdf` if you chose the B&W interior — its spine is sized for groundwood caliper) |
| Preview | Run Print Previewer; fix any margin/bleed flags before saving |

### Cover (already built — a complete wraparound)

You now have a full wraparound PDF (back | spine | front), so **skip KDP Cover
Creator** and upload the print-ready PDF directly:

- **Color interior →** `dist/kdp/plain-dharma-kdp-cover-color.pdf`
- **B&W interior →** `dist/kdp/plain-dharma-kdp-cover-bw.pdf`

The front is a **generated 5×8** cover (`generate-front-cover.ts` — the 6×9
designer `cover.jpg` is the wrong ratio for 5×8 and is Kindle-only). The back
carries the real **paperback ISBN barcode (978-1-891328-39-8)**. Built dimensions:

- Page count: **48** · spine = 48 × caliper → **0.108"** color (white, 0.002252) / **0.113"** B&W (groundwood, 0.002347)
- Verified against KDP's [cover calculator](https://kdp.amazon.com/cover-calculator) (5×8, B&W, groundwood, 48pp): spine 0.113", full cover 10.363×8.25 — ours builds 10.3627×8.25.
- Changing the paper choice means changing `CALIPER` in `scripts/build-kdp.ts` and rebuilding the wraparound; the spine drives both panel offsets.
- Full cover **width** = 0.125 + 5 + spine + 5 + 0.125 ≈ **10.35"**; **height** = 8.25"
- **No spine text** — at 46 pages the spine is ~0.10", below KDP's 100-page minimum.

To rebuild after a content/cover change: `pnpm generate-front-cover && pnpm generate-back-cover && pnpm build-kdp`.

## Screen 3 — Paperback Pricing

| Field | Value |
|---|---|
| Territories | All territories |
| Primary marketplace | Amazon.com |
| List price (USD) | **⚠️ Must be ≥ KDP's shown minimum** — color printing on 42 pp sets a floor (likely ~$4–6). Set the list price to the minimum KDP displays. |

> Paperbacks can't be free. Set the lowest price KDP allows so it just covers
> printing. The free version stays on plaindharma.com.

---

# Decisions to confirm before you submit

### 1. Publishing rights  ⚠️
KDP asks: *"public domain work"* vs *"I own the copyright and hold publishing rights."*

- The ancient suttas are public domain, **but your plain-English rendering is your
  own original work** — so the accurate, lower-friction choice is
  **"I own the copyright and I hold the necessary publishing rights."** (This is a
  rights-holder statement, not an authorship credit — it doesn't conflict with the
  translator/editor byline above.)
- Selecting *"public domain work"* triggers price caps and KDP's duplicate-content
  checks (it may reject editions that match existing free public-domain texts).
- Releasing it CC0 to the public does **not** stop you from being the rights holder
  for KDP's purposes. Recommended: **"I own the copyright…"**

### 2. AI content disclosure  ⚠️
KDP requires disclosure of **AI-generated** content (it does *not* require disclosing
AI-*assisted* work you created and refined). Answer honestly per category:

- **Images:** the interior illustrations and cover artwork are AI-generated (Gemini)
  → disclose **Yes, AI-generated images**, and note the number of images.
- **Text / Translation:** the rendering was **drafted with AI from the Pāli, then
  refined by hand** — and the book's own Description and the `/how-it-was-made` page say
  so *publicly*. To stay consistent with that public framing — and because disclosure is
  never shown to buyers or used in ranking, while under-disclosing risks account action —
  disclose it as **AI-generated text/translation**. Reserve the AI-*assisted* answer (no
  disclosure) only for work that was genuinely human-first with incidental AI help, which
  — given what you already say publicly — this isn't. **Recommended: disclose.**

### 3. Do NOT enroll in KDP Select
Select demands Amazon **exclusivity** for the ebook — incompatible with distributing
the same EPUB free on plaindharma.com (and anywhere else). Leave it unchecked.

---

# After publishing

### The Kindle edition is paid ($4.99) by design
Earlier drafts considered price-matching the Kindle file down to $0.00. That's
been dropped: the Kindle edition is now a **paid $4.99 edition**, and the free
in-app EPUB has been removed. Generosity is routed to the free PDF/audiobook +
web reading on plaindharma.com and to the donate flow ($5/$15/$30), not to a
free Kindle file. (Kindle still can't be set to $0 directly anyway.)

### Link the editions
Kindle + paperback created under the same title auto-link on one product page. If they
don't, use **Contact Us** and give both ASINs to request linking.

### Audiobook: Audible is blocked, but not for the reason first recorded

An earlier version of this section blamed ACX's lack of a public API and CC0 status.
That was wrong. The operative blocker is **the narration itself**. Verified 6 Sep 2026:

1. **ACX** — <https://help.acx.com/s/article/acx-audio-submission-requirements> states
   *"Unauthorized use of text-to-speech, AI, or automated recordings in ACX titles is
   prohibited"* and that titles *"must be narrated by a human unless otherwise
   authorized."* Our narration is ElevenLabs, so ACX is closed. A free ISBN/ASIN does
   not change this. The same page says Audible *"is working to accept third-party TTS
   content from publishers and creators who are interested"* — so the move is to
   **request authorization**, never to upload AI narration and hope.
2. **KDP Virtual Voice** — the sanctioned AI route, and it *does* reach Audible
   (sells on Amazon, Audible, Alexa and Amazon Music Unlimited, 40% royalty, US-only).
   But it is an **invite-only beta**: when a title is eligible, an *"Add Audible
   audiobook with virtual voice"* entry appears in its KDP Bookshelf menu. As of
   6 Sep 2026 ours does **not** have it. And it would narrate with Amazon's voice,
   discarding the Theo Silk recording and its 30% meditative time-stretch.

Until one of those opens, distribute via your own `/download` page (already wired),
Insight Timer, or Findaway Voices/Spotify for Apple/Google/Kobo.

#### ⚠️ The ACX contract conflicts with CC0 — read before delivering audio

An ACX title exists (`A1WCYS5HNLRGZG`, contract `A60Q4CVL0OQV6`) and was accepted on
**Exclusive** distribution, worldwide. Reviewed 6 Sep 2026 against agreement v3.1:

- **§2(a)** — during the Distribution Period the rights holder will not, *and will not
  permit any third party to*, distribute the audiobook or any portion of it in any
  audio format. Our audiobook is already a free download on plaindharma.com, and
  **CC0 is an irrevocable grant to everyone** — that permission cannot be withdrawn.
- **§1** — warrants ability to "fully perform". Hard to square with the above.
- **§4(g)** — appoints Audible as our agent to issue **take-down notices** against
  third parties hosting the audiobook. Those are exactly the redistributors the
  project exists to encourage (Internet Archive, YouTube, Insight Timer — all in the
  launch plan).
- **Term** — 7 years from first sale, auto-renewing yearly. §2(c) (switch exclusive ↔
  non-exclusive, one time) and §2(d) (terminate) **both require 90 days on sale first**.
- **Royalties** — 50% exclusive / 30% non-exclusive under v3.1.
- **§4(c)** — retail excerpt ≤5 min or 10% of runtime, whichever is longer (5m02s for
  us). *On Loving-Kindness* (3m17s) fits and is a complete teaching.
- **§6(b)** — if Audible rejects the audiobook the agreement terminates.

**Do not deliver audio until the election is resolved** — delivery starts the clock.
A request to move to non-exclusive was drafted to info@acx.com on 6 Sep 2026.

Separately, the audio is **64 kbps** throughout (all 39 section MP3s and the m4b);
ACX requires **192 kbps CBR** minimum. No higher-quality masters exist on disk —
check the private `audio-archive` bucket before assuming re-encoding is possible.

**Narration is an AI voice, not a human reader.** The audiobook is synthesized with
ElevenLabs (Theo Silk), then human-paced (pause markers + 30% time-stretch) and
assembled by Alex Miller. Credit it honestly — *"Narrated by an AI voice (ElevenLabs);
produced by Alex Miller"* — and never imply a human narrator. Findaway/Spotify/Google
all require an **AI-narration disclosure** at upload; check the box. This mirrors the
text's AI-drafted / human-refined provenance on `/how-it-was-made`.
