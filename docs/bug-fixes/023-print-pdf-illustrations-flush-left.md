# Bug #023: Print PDF Illustrations Flush Left

**Date:** 2026-09-12  
**Severity:** Medium — visual polish on printed output, but once a book is printed it cannot be fixed  
**Status:** Partially fixed (new printshop build only; original KDP PDF still has bug)

---

## Symptom

In the shipped B&W print PDF (`public/downloads/plain-dharma-print-bw.pdf`), each sutta's illustration sits noticeably left-aligned on the page instead of centered. The illustration and its surrounding text do not form a balanced visual block — the image appears off-center, which reads as unpolished on printed output.

Example: Page 9 of the live PDF (the sun illustration for "The Buddha's First Talk") is visibly left of the page's text-block center.

---

## Root Cause

In `scripts/lib/book-source.ts`, the `buildBookMarkdown()` function emits each sutta's illustration as a bare standalone markdown image:

```ts
parts.push(`![${alt}](${illustration})\n`);
```

Pandoc converts a markdown-implicit standalone `![]()` (with implicit_figures disabled) into a LaTeX paragraph containing a bare `\includegraphics{...}` command. The print preambles (`scripts/templates/pdf-preamble-print.tex` and the new `scripts/templates/pdf-preamble-printshop.tex`) set:

```tex
\setlength{\parindent}{0pt}
```

This removes paragraph indentation for print typography. However, a paragraph containing only `\includegraphics` with no explicit centering environment is subject to LaTeX's default paragraph justification, which is **left-aligned**. Without an explicit `\begin{center}...\end{center}` wrapper, `\includegraphics` renders flush-left even though the text block itself is centered on the page.

The bare image paragraph becomes a left-aligned paragraph inside a centered text block, producing the visual misalignment.

---

## The Fix

A new build script, `scripts/build-printshop-pdf.ts` (created this session for the A5 copy-shop edition), includes a `centerImages()` function that post-processes the generated markdown *before* pandoc sees it:

```ts
function centerImages(md: string): string {
  return md.replace(
    /^!\[([^\]]*)\]\(([^)]+)\)$/gm,
    (_full, _alt, path) =>
      `\\begin{center}\n\\includegraphics[width=${ILLUSTRATION_WIDTH_FRAC}\\linewidth,` +
      `keepaspectratio]{${path}}\n\\end{center}`,
  );
}
```

This regex matches each standalone markdown image line and rewrites it into an explicit LaTeX `\begin{center}...\end{center}` block *before* pandoc's markdown → LaTeX conversion. When xelatex processes the explicit center environment, the illustration renders properly centered on the page.

**Before:**
```
![Sun image](sun.png)
```

**After (in LaTeX):**
```tex
\begin{center}
\includegraphics[width=0.7\linewidth,keepaspectratio]{sun.png}
\end{center}
```

**Result:** Illustrations are visibly centered on the page. Confirmed this session by rendering the printshop PDF and inspecting the output.

---

## Key Rule

**A standalone markdown image handed to pandoc for LaTeX output needs an explicit `\begin{center}` wrapper when `\parindent` is 0 — LaTeX does not center a bare `\includegraphics` by default.** Removing indentation for typography is correct, but it exposes the default left-alignment behavior for bare images. Always wrap standalone images in a centering environment to override the left-aligned paragraph default.

---

## Files Involved

**Fixed in new build (printshop edition):**
- `scripts/build-printshop-pdf.ts` — includes the `centerImages()` regex that wraps each standalone image in LaTeX `\begin{center}...\end{center}`

**Still broken (original KDP trim PDF):**
- `scripts/build-print-pdf.ts` — uses `buildBookMarkdown()` directly with no `centerImages()` equivalent; ships the bug in the currently-live `plain-dharma-print-bw.pdf` and `plain-dharma-print-color.pdf` on the download page
- `scripts/lib/book-source.ts` — `buildBookMarkdown()` emits bare `![]()` without centering; used by the original KDP build

**Related:**
- `scripts/templates/pdf-preamble-print.tex` and `scripts/templates/pdf-preamble-printshop.tex` — both set `\setlength{\parindent}{0pt}`, which exposes the default left-alignment

---

## Follow-up

The same `centerImages()` fix should eventually be applied to `scripts/build-print-pdf.ts` (or hoisted into `buildBookMarkdown()` in `scripts/lib/book-source.ts` itself) to fix the illustration centering in the currently-live plain-dharma-print-bw.pdf and plain-dharma-print-color.pdf. This was deliberately scoped out of this session in favor of the new printshop build, but the original KDP trim PDF still exhibits the bug and should be regenerated and re-uploaded when the fix is applied.

