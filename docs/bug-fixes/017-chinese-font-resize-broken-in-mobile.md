# 017 — React Native: Reading-Size Control Did Not Resize Chinese Text on Mobile

**Date:** 2026-06-08  
**Severity:** Medium  
**Component:** apps/mobile sutta reader text sizing and fonts  

## Symptom

In the mobile (Expo/iOS) sutta reader, the reading-size control (Aa button) successfully resized English text across all sutta pages — but **did not resize Chinese (Traditional and Simplified) text**, leaving it stuck at the base size regardless of the scale slider position.

The behavior was correct only for English; Chinese text remained unresponsive to user font-size adjustments.

## Root Cause

The issue stemmed from iOS glyph substitution and how iOS respects font metrics:

### The Problem Path

In `apps/mobile/src/theme/tokens.ts`, reader fonts were hardcoded as Latin-only faces:

```typescript
// BEFORE: apps/mobile/src/theme/tokens.ts
export const READER_FONTS = {
  body: 'Garamond Libre',
  heading: 'Garamond Libre',
  bold: 'Garamond Libre',
  // (no CJK fallback)
};
```

Both the selectable text path (`SelectableSectionText.tsx`) and the markdown renderer path (`MarkdownRenderer.tsx`) applied fontSize like this:

```typescript
// In SelectableSectionText.tsx and MarkdownRenderer.tsx
fontSize: BASE_FONT_SIZE * scale
```

**The glyph substitution issue:** When iOS encounters a CJK character in a Latin font (Garamond Libre has no Chinese glyphs), it **substitutes a fallback face at render time** — typically the system font or a font with CJK coverage. This substitution happens automatically, but **the substituted glyph does NOT inherit the explicitly-set fontSize** from the Latin font style. iOS renders the CJK character at whatever default size that fallback font defines, ignoring the point size set on the Latin parent style.

English text, rendered directly by Garamond Libre (which has all Latin glyphs), honors the fontSize setting correctly. Chinese text, substituted at render time, silently ignored it. Both went through identical `fontSize = BASE_FONT_SIZE * scale` code, but only English resized.

## The Fix

Added a locale-aware font selector in `tokens.ts` that returns a **real CJK font when rendering Chinese**, eliminating the glyph substitution problem:

### 1. Created readerFonts() Function
**Updated:** `apps/mobile/src/theme/tokens.ts`

```typescript
// AFTER: apps/mobile/src/theme/tokens.ts
export function readerFonts(
  font: 'body' | 'heading' | 'bold',
  locale: string
): FontResource {
  if (locale === 'zh') {
    // Use a system CJK font that understands fontSize
    return 'Songti SC'; // iOS has this; Android falls back to system
  }
  // English uses the registered Latin fonts
  return READER_FONTS[font];
}
```

For Chinese, use a native CJK typeface ("Songti SC" on iOS, system fallback elsewhere) that has complete glyph coverage and respects explicit fontSize settings. No separate bold or italic face is needed — iOS applies `fontWeight` (100–900) on top of the single family name.

### 2. Updated SelectableSectionText Component
**Updated:** `apps/mobile/src/marginalia/SelectableSectionText.tsx`

The component now calls `readerFonts()` instead of directly referencing `READER_FONTS`:

```typescript
// AFTER: apps/mobile/src/marginalia/SelectableSectionText.tsx
export function SelectableSectionText({
  runs,
  scale,
  locale,
  // ... other props
}: SelectableSectionTextProps) {
  return runs.map((run) => {
    const font = run.style === 'bold' ? 'bold' : 'body';
    const fontFamily = readerFonts(font, locale);
    
    return (
      <UITextView
        key={run.id}
        style={{
          fontFamily,
          fontSize: BASE_FONT_SIZE * scale, // Now honored for CJK!
          fontWeight: run.style === 'bold' ? '700' : '400',
        }}
      >
        {run.text}
      </UITextView>
    );
  });
}
```

### 3. Updated MarkdownRenderer Component
**Updated:** `apps/mobile/src/components/MarkdownRenderer.tsx`

Similarly updated to resolve fonts via `readerFonts()`:

```typescript
// AFTER: apps/mobile/src/components/MarkdownRenderer.tsx
// In renderText() and renderHeading():
const fontFamily = readerFonts(fontType, locale);

// In renderText():
<Text style={{
  fontFamily,
  fontSize: baseSize * scale,
  // ... other styles
}}>
  {children}
</Text>

// In renderHeading():
<Text style={{
  fontFamily: readerFonts('heading', locale),
  fontSize: headingSize * scale,
  fontWeight: '700',
}}>
  {children}
</Text>
```

## Key Rule

**Render CJK text with a native CJK font, not by relying on glyph substitution of a Latin font.** When a Latin typeface lacks glyphs for a script, the rendering engine substitutes a fallback at draw time — and that substitution silently ignores explicitly-set fontSize and other style properties. Always provide a real font with full glyph coverage for each script. Use locale to pick the right family; apply weight/style variations via `fontWeight` and `fontStyle` properties on a single family rather than swapping family names.

## Files Involved

- `apps/mobile/src/theme/tokens.ts` — added `readerFonts(font, locale)` function; returns CJK font for Chinese, Latin fonts for English
- `apps/mobile/src/marginalia/SelectableSectionText.tsx` — updated to call `readerFonts()` instead of hardcoding READER_FONTS
- `apps/mobile/src/components/MarkdownRenderer.tsx` — updated to call `readerFonts()` in all text rendering paths (renderText, renderHeading)

**Commit:** e6b48f8
