# Bowker ISBN Registration — final values

The settled Bowker/ONIX record for ISBN **978-1-891328-37-4**
(Plain Dharma, English **EPUB** edition). These values are reconciled against
the printed cover, the EPUB build, and the $4.99 pricing decision — enter them
as-is.

> This file was originally a list of issues to fix; those are now resolved and
> folded into the values below. Three facts changed since the first review:
> the **subtitle** (settled on the cover wording), the **file size**
> (463 KB → 802 KB after the Jun-8 rebuild), and the **price**
> ($0.99 → $4.99, per the pricing research in `docs/todos.md` discussion).

## Title & Contributors

| Field | Value |
|---|---|
| Title | `Plain Dharma` |
| Subtitle | `The Buddha's Foundational Teachings in Modern English` |
| Language | **English only** — leave Mandarin **unchecked** |
| Copyright year | `2026` |
| Gautama Buddha — function | `Author` |
| Claude Opus — function | `Translator` |
| Alex Miller — functions | `Compiled by` · `Editor` |
| Ellen Shapiro — functions | `Consultant Editor` · `Cover Design by` |
| Publisher | `Visual Language LLC dba Alphagram Learning Materials` |
| Imprint | `Plain Dharma Press` |

- **Subtitle** must match the printed cover exactly — no "Six", no "Plain"
  (the brand "Plain Dharma" already owns that word). It also matches
  `BOOK_SUBTITLE` in `scripts/lib/book-source.ts`.
- **⚠️ Known defect (found 6 Sep 2026):** both live Bowker records were registered as
  *"Plain Dharma: The Buddha's **Six** Foundational Teachings in Modern English"* —
  the cover's kicker line ("SIX FOUNDATIONAL TEACHINGS") was mistaken for part of the
  subtitle. Every other surface, including both Amazon listings, omits "Six". Fix
  `…-37-4` before cloning it for the new paperback record, or the error propagates.
- **Sales Rights is CC0-sensitive.** Bowker's Rights Type list has no plain "World
  rights" — every option is an ONIX sales-restriction code. Pick the **non-exclusive**
  variant, never the exclusive one: the book is CC0, the publisher holds no
  exclusivity, and anyone may print it. Claiming exclusive rights in a feed that
  distributors act on would contradict the licence printed inside the book.
- **The Sales Rights table is fiddly.** "Add" appends a blank row without opening a
  form; you then click "Edit" on that row to fill it. "Delete" fires a native browser
  confirm that freezes automation until a human dismisses it, and it can take out
  more rows than intended — add exactly one row and fill it.
- **Use the dashboard's Clone action** to seed a new edition's record from `…-37-4`
  — it carries the contributors and title across, so only the ISBN and the format
  block need re-entry. Clone *after* the subtitle fix, never before.
- **Do not check "Author"** for Alex — it conflicts with the book's own
  positioning ("a plain reading, not a scholarly translation") and overstates
  the relationship to 2,500-year-old source material.
- **Do not check any translation function for Alex** — not `Translator`, not
  `Translated with commentary by`, not `Edited and Translated by`. Claude Opus
  drafted the English from the Pāli; Alex edited it line by line and does not read
  Pāli. This is the book-wide credit split and it holds on every surface — cover,
  colophon, EPUB metadata, JSON-LD, KDP, and here. An earlier version of this file
  wrongly listed `Translated with commentary by` for Alex; it was corrected on the
  live …-37-4 record in Sep 2026.
- **Mandarin is a separate edition** and needs its own ISBN from Ellen's
  978-1-891328 block when the ZH version publishes. ISBNs are per-edition.

## Format & Size

| Field | Value |
|---|---|
| Medium | `E-Book` |
| Format | `Electronic book text` *(not "Digital online", which means online-only access)* |
| eBook File Type | `EPUB` |
| eBook File Size | `885 KB` *(actual `dist/ebook/plain-dharma.epub` = 884,986 bytes as of the 26 Jul 2026 rebuild; the record still reads the stale `802 KB` from the 8 Jun build — confirm against the EPUB actually uploaded to KDP before correcting)* |
| Packaging Description | *(blank — "Digipak" is physical-disc packaging, N/A for an ebook)* |
| Trade Catalog | `E-book short` (optional) or blank |
| First Genre | `BUDDHISM` |
| Second Genre | `DEVOTIONAL LITERATURE` |

## Sales & Pricing (United States)

| Field | Value |
|---|---|
| Publication Date | publish-day (set when you register; keep aligned with the KDP date) |
| Title Status | `Active Record` |
| Target Audience | `Trade` *(not "Adult Education" — that implies classroom/curriculum)* |
| Currency / Price / Type | `US Dollars` / `4.99` / `Retail Price` |
| Price Availability | `Available` |
| Sales Rights (if shown) | Type `World rights`, Territory `World` |

> **Price = $4.99**, not the $0.99 floor from earlier drafts. $4.99 sits inside
> Amazon's 70% royalty band ($2.99–$9.99); the original plain-English rendering
> is your own copyrightable work, so the public-domain 35%/rejection rule does
> **not** apply. See `docs/publishing/KDP_PUBLISHING.md` for the KDP side.

---

## Paperback records

ISBNs are per-edition, so the print edition is its own ONIX record. **Title,
Subtitle, Publisher, Imprint, Copyright year, Contributors, Genres, and Sales
Rights are identical to the EPUB record above** — only the format block and price
differ.

| Field | Value |
|---|---|
| Medium | `Print` |
| Format | `Paperback` *(Bowker's Print list has no "Trade Paperback" option)* |
| Trim size | `5 x 8 in` |
| Page count | `48` |
| Size Units / Length(1) / Width(2) | `Inches` / `8` / `5` |
| Height(3) — thickness | `0.12` *(matches the dimensions Amazon publishes for …-38-1; the 0.108" color vs 0.113" groundwood spine only matters when choosing which cover PDF to upload to KDP)* |
| Number of illustrations | `6` *(the six per-teaching illustrations; the QR code on p.45 is a functional graphic, not an illustration — verified with `pdfimages -list` on the KDP interior)* |
| Format Details | *(leave empty — optional, and the two tempting codes both misdescribe the book: `New Edition` claims revised content that doesn't exist, `Illustrated edition` implies an illustrated version of a normally-unillustrated work)* |
| Sales Rights — Type | `For sale with non-exclusive rights in the specified country/ies` |
| Sales Rights — Territory | `World` |

**When cloning from `…-37-4`, clear the EPUB-only fields** — the clone carries them
over and they are meaningless on a print record: **eBook File Type** (`EPUB`),
**eBook File Size**, and **Trade Catalog** (`E-book short`). Genres, contributors,
publisher, imprint, and title all carry over correctly and should not be re-entered.
| Currency / Price / Type | `US Dollars` / *match the live KDP list price* / `Retail Price` |

### …-38-1 — first paperback, superseded

Registered Jun 2026, but the ONIX record was **never completed** — the dashboard shows
it as `Incomplete` with Media/Format `N/A`, so it carries the number and nothing else.
There is no metadata worth migrating off it. Its KDP listing shipped with `Alex Miller` locked into the
primary Author field (KDP only allows that edit within 72 hours of publication).
Being replaced by a new edition — see the checklist in `KDP_PUBLISHING.md`.

**Do not complete this record.** An `Incomplete` record is never distributed to Books
In Print, which is the right end state for a retired edition — completing it would
publish an entry for a delisted ASIN alongside the live entry for its replacement.
Leave it as-is; only mark it `Out of Print` if it ever gets completed for some other
reason. The number stays burned either way: it is printed on the copies already sold
and on the …-38-1 cover, so it can never be reused.

### …-39-8 — replacement paperback (registered 6 Sep 2026)

Taken from Ellen's `978-1-891328` block; cloned from `…-37-4` and submitted. Use the assigned digits
verbatim; the EAN-13 check digit is not derivable from …-38-1, and the barcode is
generated from this string by `ean13Svg()` in `scripts/render-covers.ts`.

Two more editions will each need their own ISBN when they ship: the **audiobook**
and the **Mandarin** edition.
