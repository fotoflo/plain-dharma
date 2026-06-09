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
| Alex Miller — functions | `Translated with commentary by` · `Compiled by` · `Editor` · `Cover Design by` |
| Ellen — function | `Cover Design by` only |
| Publisher | `Visual Language LLC dba Alphagram Learning Materials` |
| Imprint | `Plain Dharma Press` |

- **Subtitle** must match the printed cover exactly — no "Six", no "Plain"
  (the brand "Plain Dharma" already owns that word). It also matches
  `BOOK_SUBTITLE` in `scripts/lib/book-source.ts`.
- **Do not check "Author"** for Alex — it conflicts with the book's own
  positioning ("a plain reading, not a scholarly translation") and overstates
  the relationship to 2,500-year-old source material.
- **Mandarin is a separate edition** and needs its own ISBN from Ellen's
  978-1-891328 block when the ZH version publishes. ISBNs are per-edition.

## Format & Size

| Field | Value |
|---|---|
| Medium | `E-Book` |
| Format | `Electronic book text` *(not "Digital online", which means online-only access)* |
| eBook File Type | `EPUB` |
| eBook File Size | `802 KB` *(actual `dist/ebook/plain-dharma.epub` = 820,971 bytes)* |
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

## Not in this form — but don't forget

**The paperback needs its own ISBN.** This registration is the EPUB only
(Medium: E-Book). The print edition is a separate ONIX record and needs a
second ISBN from Ellen's 978-1-891328 block — plan it before printing the
cover, which prints the barcode for that number.
