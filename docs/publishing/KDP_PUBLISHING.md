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
| eBook cover art (front) | `dist/ebook/cover.jpg` | 1600×2400, 6×9 — the designer's InDesign front, for the **Kindle** edition only |
| Paperback interior (color) | `dist/kdp/plain-dharma-kdp-interior-color.pdf` | 48 pp, 5.25"×8.25" (5×8 + bleed), **cover-free**, cream bg |
| Paperback interior (B&W, cheaper) | `dist/kdp/plain-dharma-kdp-interior-bw.pdf` | 48 pp, grayscale, white paper, **cover-free** |
| Paperback wraparound cover (color) | `dist/kdp/plain-dharma-kdp-cover-color.pdf` | 10.35×8.25, back+spine+front, spine 0.108", barcode = print ISBN ‑38‑1 |
| Paperback wraparound cover (B&W interior) | `dist/kdp/plain-dharma-kdp-cover-bw.pdf` | same art, spine 0.120" (cream caliper) — match to the B&W interior |

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
| Author — First name | `Alex` |
| Author — Last name | `Miller` |
| Contributors | *(none)* |
| Description | *(paste the block below)* |
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
| Book Cover | "Upload a cover you already have" → `dist/ebook/cover.jpg` |
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
`The Buddha's Foundational Teachings in Modern English`, Author
`Alex` / `Miller`, the same Description, Categories, and Keywords, and the same
**⚠️ DECIDE** Publishing-rights choice.

## Screen 2 — Paperback Content

| Field | Value |
|---|---|
| ISBN | Use your own Bowker ISBN: **`978-1-891328-38-1`** (the paperback edition — distinct from the ebook's `…-37-4`). Choose "I have my own ISBN" and enter it; do **not** take a free KDP ISBN (the free one isn't portable to other printers). |
| Publication date | *(leave blank — uses approval date)* |
| Print — Ink & Paper | **⚠️ DECIDE:** Color variant → **Premium color, white paper** · B&W variant → **Black & white, cream paper** |
| Trim size | 5 x 8 in |
| Bleed | **Bleed (PDF has bleed)** — interiors are 5.25"×8.25" |
| Cover finish | Matte |
| Manuscript | Upload `dist/kdp/plain-dharma-kdp-interior-color.pdf` (or `-bw.pdf` to match the paper choice above) — these are **cover-free**, as KDP requires |
| Book Cover | "Upload a print-ready PDF (recommended)" → `dist/kdp/plain-dharma-kdp-cover-color.pdf` (use `-bw.pdf` if you chose the B&W interior — its spine is sized for cream caliper) |
| Preview | Run Print Previewer; fix any margin/bleed flags before saving |

### Cover (already built — a complete wraparound)

You now have a full wraparound PDF (back | spine | front), so **skip KDP Cover
Creator** and upload the print-ready PDF directly:

- **Color interior →** `dist/kdp/plain-dharma-kdp-cover-color.pdf`
- **B&W interior →** `dist/kdp/plain-dharma-kdp-cover-bw.pdf`

The front is a **generated 5×8** cover (`generate-front-cover.ts` — the 6×9
designer `cover.jpg` is the wrong ratio for 5×8 and is Kindle-only). The back
carries the real **paperback ISBN barcode (978-1-891328-38-1)**. Built dimensions:

- Page count: **48** · spine = 48 × caliper → **0.108"** color (white) / **0.120"** B&W (cream)
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

- The ancient suttas are public domain, **but your plain-English rendering is an
  original work you authored** — so the accurate, lower-friction choice is
  **"I own the copyright and I hold the necessary publishing rights."**
- Selecting *"public domain work"* triggers price caps and KDP's duplicate-content
  checks (it may reject editions that match existing free public-domain texts).
- Releasing it CC0 to the public does **not** stop you from being the rights holder
  for KDP's purposes. Recommended: **"I own the copyright…"**

### 2. AI content disclosure  ⚠️
KDP requires disclosure of **AI-generated** content (it does *not* require disclosing
AI-*assisted* work you created and refined). Answer honestly per category:

- **Images:** the interior illustrations and cover artwork are AI-generated (Gemini)
  → disclose **Yes, AI-generated images**, and note the number of images.
- **Text / Translation:** if the plain-English rendering was produced by an AI tool
  and then edited, KDP treats that as AI-generated text/translation → disclose. If you
  wrote/translated it yourself with only incidental AI help, it's AI-*assisted* → no
  disclosure. **You decide which is true.** Disclosure is not shown to buyers and does
  not hurt ranking; under-disclosing risks account action.

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

### Out of scope: audiobook
The `.m4b` cannot go to Audible — ACX has no public API and won't accept a CC0/public-
domain narration without Approved-Producer status. Distribute the audiobook via your
own `/download` page (already wired), or Findaway Voices/Spotify for Apple/Google/Kobo.
