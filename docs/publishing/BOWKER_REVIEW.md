# Bowker ISBN Registration — Review

Review of the Bowker registration form for ISBN **978-1-891328-37-4**
(Plain Dharma, English EPUB edition). Issues are grouped by severity.

## 🔴 Must fix (consistency / correctness)

### 1. Subtitle mismatch with the actual book

- **Bowker says:** `The Buddha's Six Foundational Teachings in Plain Modern English`
- **EPUB metadata + KDP guide say:** `Six Foundational Buddhist Teachings in Plain Modern English`

Pick one and align all three (Bowker, `scripts/lib/book-source.ts:27`, KDP).
The cover JPG also reads "Six Foundational Buddhist Teachings" — so if you
change Bowker to match the canonical version, you don't have to rebuild the
cover or EPUB.

### 2. Language: Mandarin should NOT be checked here

ISBNs are per-edition, and Bowker treats a translation as a separate edition.
This ISBN (978-1-891328-37-4) is for the **English EPUB**. Uncheck Mandarin —
the ZH edition needs its own ISBN from Ellen's block when you publish it.

### 3. "Author" in Alex's functions is questionable

The Buddha is the original author of the suttas. Given the context — Claude
did the primary Pali → EN translation, Alex edited collaboratively — the
accurate function set is:

- ✅ Translated with commentary by
- ✅ Compiled by
- ✅ Editor
- ✅ Cover Design by
- ❌ **Drop "Author"** — it conflicts with the book's own positioning ("not
  a scholarly translation, a plain reading") and overstates the relationship
  to source material that's 2,500 years old.

## 🟡 Should fix (better fit)

### 4. Target Audience: "Adult Education" → "Trade"

"Adult Education" implies curriculum / classroom. Plain Dharma is for general
adult readers picking up a dharma book — **Trade** is the standard category
for that.

### 5. Format: "Digital online" → "Electronic book text"

For an EPUB, "Electronic book text" is the standard ONIX value. "Digital
online" suggests a web-only format with no downloadable file.

## ⚪ Empty fields to fill

| Field | Suggested value |
|---|---|
| eBook File Size | `463 KB` (actual size of `dist/ebook/plain-dharma.epub`) |
| US → Price | `0.99` (matches the KDP floor) |
| US → Price Type | `Retail Price` |
| US → Price Availability | `Active` |
| US → Sales Rights → Type | `World rights` |
| US → Sales Rights → Territory | `World` |

You can also add Australia / Canada / NZ / UK markets to mirror KDP's "All
territories" — same price, same rights — but US-only is fine; ONIX
distribution still reaches global retailers.

## 📋 Not in this form — but don't forget

**The paperback needs its own ISBN.** This registration is for the EPUB only
(Medium: E-Book). The 42-page print edition is a separate ONIX record and
needs a second ISBN from Ellen's 978-1-891328 block. Plan that one now so
the print cover (which prints the barcode) uses the right number.

## ✅ Looks correct

- Copyright year 2026, publication date May 31, 2026
- Imprint "Plain Dharma Press" — nice; this is what will show on the Amazon
  detail page when KDP imports the Bowker record (better than "Indy Pub"
  or KDP's default)
- Ellen with "Cover Design by" only — matches what she actually did
- Genres BUDDHISM / DEVOTIONAL LITERATURE — fine
- Publisher "Visual Language LLC dba Alphagram Learning Materials" — correct
  per Ellen's account setup
