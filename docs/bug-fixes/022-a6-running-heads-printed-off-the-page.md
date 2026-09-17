# Bug #022: A6 Running Heads Printed Off the Top of the Page

**Date:** 2026-09-17  
**Severity:** High — every printed copy was affected, content physically lost  
**Status:** Fixed

---

## Symptom

On the A6 print-shop edition, every page carrying a running head printed with the tops of its capitals sliced off — "CONTENTS", "1. THE BUDDHA'S FIRST TALK", and others appeared truncated at the top of the page. The head sat hard against the trim edge and had already lost ink. On a booklet the copy shop then cut and bound, the trim blade would slice further into or completely remove the head.

The first batch shipped to the print shop arrived with text missing from every right-hand page, a problem that would have replicated across every printed copy in the run.

---

## Root Cause

The LaTeX `geometry` package places the running head ABOVE the `top` margin, not inside it. Between the paper edge and the body text, there must be room for both `headheight` (the height of the head box) and `headsep` (the vertical gap between the head box and the body).

A6 was configured with `top: 10mm`, the book class's default `headsep: 18pt` (≈6.4mm), and default `headheight: 14pt` (≈5mm):

```
Required space = headheight + headsep = 5mm + 6.4mm = 11.3mm
Actual space   = top = 10mm
Deficit        = 10 - 11.3 = -1.3mm
```

At -1.3mm, the head box started 1.3mm ABOVE the page edge and was clipped by the MediaBox. The head hung off the physical page before the shop's trim blade cut anything.

The same issue did not affect the A5 edition because its `top: 16mm` comfortably exceeds the head's requirements.

---

## Why It Was Hard to Find

- **Looked correct in the PDF viewer.** Opening the PDF in a standard viewer showed no obvious clipping because most readers render past the MediaBox edge or do not show the hard boundary.
- **Page count was right.** The pagination (72 pages) was correct, so no sanity checks flagged it.
- **Existing margin comments were misleading.** Early investigation of `pdftotext -bbox` output reported a plausible top coordinate, which initially pointed away from the geometry layer.
- **Only caught by direct measurement.** Rasterizing the page with ImageMagick and measuring pixel colors revealed the actual ink location. Running `magick page.png -bordercolor white -border 1 -trim` showed ink starting at row 0 (the very top edge), and measuring the mean color of the top 6 rows gave 60135 (dark gray) instead of 65535 (pure white).
- **A/B comparison isolated it to A6.** The same measurement on the A5 edition showed a clean 5.75mm top margin with a mean color of 65535, which proved the issue was specific to A6's geometry, not the PDF renderer itself.

---

## The Fix

**Part 1: Adjust A6 margins and headsep**

The `headsep` was reduced from the class default 18pt (6.4mm) to 8pt (2.8mm). This is safe because the head is typeset smaller on A6 (`\footnotesize`, stepping down to `\scriptsize`/`\tiny` if a title still overruns the measure) and does not need the class's A4-sized gap. The margin `top` was increased from 10mm to 14mm, and `bottom` was decreased from 12mm to 8mm (trading 4mm to hold `textheight` constant).

**Before** (`scripts/build-printshop-pdf.ts`):
```ts
// A6 edition
margins: { inner: 14, outer: 8, top: 10, bottom: 12 },
```

**After:**
```ts
// A6 edition
margins: { inner: 14, outer: 8, top: 14, bottom: 8 },
```

And in the A6 `typesetTuning`:
```tex
\setlength{\headsep}{8pt}
```

**Why this holds pagination:** `textheight` (the height of the body text block) is calculated by `\paperheight - top - bottom - footskip - headsep - headheight`. When top and bottom trade 4mm (top +4, bottom -4), the sum stays the same, so `textheight` is unchanged at 126mm. All 72 pages of A6 remain at their published count — the head now lands 3.7mm inside the trim edge instead of 1.3mm above it (measured off the rendered page, not calculated — the arithmetic predicted 6.2mm, and the head box overflows its 14pt `headheight` upward, which accounts for the difference).

**Part 2: Redefine `\cleardoublepage` to suppress heads on blank versos**

Blank pages inserted to open a chapter on a recto were still being stamped with a running head and folio, creating the false appearance of a misprint. Redefining `\cleardoublepage` to apply `\thispagestyle{empty}` to the blank page cures this:

```tex
\renewcommand{\cleardoublepage}{%
  \clearpage
  \if@twoside
    \ifodd\c@page\else
      \null\thispagestyle{empty}\newpage
    \fi
  \fi}
```

**Part 3: Add stretch to `\@tocrmarg` to fix wrapped table-of-contents entries**

Wrapped section entries in the contents were justifying their first line hard across the measure, which is visually jarring for a title wrapping across lines. The `\@tocrmarg` parameter (which sets the skip before the page number) was changed from a fixed 2.1em to `2.1em plus 1fil`, allowing wrapped lines to end ragged. This mirrors the patch already applied to chapter entries (`\l@chapter`).

**Before:**
```tex
\renewcommand{\@tocrmarg}{2.1em}
```

**After:**
```tex
\renewcommand{\@tocrmarg}{2.1em plus 1fil}
```

The fill stretch rides through `\parfillskip`'s negation and cancels on the last line of an entry, leaving the dot leaders and page number unaffected.

---

## Key Rule

**With `geometry`, the `top` margin is the space above the BODY TEXT, not above the page edge. The running head lives ABOVE the top margin, occupying `headheight + headsep` of space. For a head to print inside the page boundary, `top` must exceed `headheight + headsep`, or the head will be clipped by the MediaBox.** This is especially critical for narrow trims with tight margins — test with `pdftotext -bbox` or rasterize and measure pixel colors to verify heads actually print.

---

## Files Involved

- `scripts/build-printshop-pdf.ts` — A6 margins from `{ top: 10, bottom: 12 }` to `{ top: 14, bottom: 8 }`; added `typesetTuning` field and populated it with `\setlength{\headsep}{8pt}`, `\renewcommand{\cleardoublepage}` redefinition, and `\@tocrmarg` patch.
- `scripts/templates/pdf-preamble-printshop.tex` — added `__TYPESET_TUNING__` placeholder for per-edition typesetting adjustments (previously only `__HEADER_TUNING__` and `__TOC_TUNING__` existed).
