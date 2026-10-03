# Bug #024: KDP Previewer — Running Heads Outside the Margins

**Date:** 2026-10-03
**Severity:** Medium — blocked publishing the 12pt paperback update (nothing printed wrong)
**Status:** Fixed

---

## Symptom

After the paperback interior was switched to 12pt with running heads, KDP's Print Previewer reported an ERROR — "This text is outside the margins" — on 20 pages (3, 6, 9, 10, 11 … 30). The Approve button stays disabled while any error is open, so the update could not be published.

## Root Cause

The new `fancyhdr` head sat at 31.8pt from the PDF edge (`yMin` from `pdftotext -bbox`). With 0.125" bleed, KDP's safe zone is 0.375" inside the trim, so text must start at ≥ 36pt. The head's position is `top − headsep − headheight`; with `top=0.75in` and the class-default `headsep` it landed inside the zone.

Setting `\setlength{\headsep}{8pt}` in the preamble did nothing: the `geometry` package, loaded by pandoc, recomputes it from its own options.

## The Fix

`scripts/build-kdp.ts` now passes `geometry:top=0.85in`, `geometry:headsep=8pt` and `geometry:headheight=14pt`. The head's top is now 41.7pt. The page count stayed at 51, so the wraparound cover's spine was unaffected.

## Key Rule

Any new header, footer or margin element on the KDP interior must be measured with `pdftotext -bbox` against the 36pt / 0.5" limit before upload, and layout lengths must be set through `-V geometry:…`, not in the preamble.

## Files Involved

- `scripts/build-kdp.ts`
- `scripts/templates/pdf-preamble-print.tex`
