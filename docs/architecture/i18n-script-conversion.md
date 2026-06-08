# Traditional Chinese (繁體) Script Conversion — Plain Dharma Mobile

*Last updated: 2026-06-08*

The Plain Dharma app lets Chinese readers switch between Simplified (简体, canonical) and Traditional (繁體, Taiwan standard) character forms **at render time**. The sutta content, UI strings, and audio manifests are authored once in Simplified and stay that way (for web/database compatibility); conversion happens on-device so a single build serves both scripts.

## Overview

**Why this matters:** Taiwan and Hong Kong readers expect Traditional characters; a toggle preserves the canonical single-source-of-truth in Simplified while letting readers choose their preferred display form.

**Implementation:** OpenCC (Open Chinese Convert), bundled offline (no network), converts Simplified ↔ Traditional using its `s2tw` (Mainland → Taiwan standard) dictionary. The conversion is optional — readers in English or those who don't toggle pay zero cost.

**Key constraint:** Conversion is **length-preserving** (one Han character → one Han character) and **lossless** (round-trips back to Simplified). This keeps margin-note selections/quotes aligned across scripts — a highlight at byte offset 42 in Simplified maps predictably to Traditional.

## Architecture

### Data flow

```
Canonical (Simplified) ──┬─→ [toDisplay] ──→ Rendered text
                         │   (if locale=zh + script=hant)
                         └─→ [identity] ──→ Rendered text (else)

Selection in Traditional ──→ [toCanonical] ──→ Stored in Simplified
                            (if locale=zh + script=hant)
```

### Key files

| File | Role |
|---|---|
| `apps/mobile/src/i18n/zhScript.ts` | Lazy OpenCC converters (`toTrad`, `toSimp`); `toDisplayScript` / `toCanonicalScript` entry points |
| `apps/mobile/src/i18n/LocaleContext.tsx` | App-wide locale + script state; `useLocale()` / `useZhConvert()` hooks; persisted to AsyncStorage |
| `apps/mobile/src/i18n/strings.ts` | `useStrings()` hook; deep-converts the UI string table when script is Traditional |
| `apps/mobile/src/theme/tokens.ts` | `readerFonts(font, locale)`: zh uses a CJK face (iOS "Songti SC") so resize (Aa) works |
| `apps/mobile/src/marginalia/useSuttaMarginalia.tsx` | Margin-note selection: stores quotes in canonical Simplified, displays in current script |

Consumer screens:
- `app/[slug].tsx`, `app/(tabs)/read.tsx`, `index.tsx`, `more.tsx`, `_layout.tsx`, `about.tsx`, `glossary.tsx`, `contribute.tsx`, `newsletter.tsx`
- Components: `AudioPanel`, `FloatingAudioPlayer`, `FloatingReadingControls`, `NewsletterSignup`, `MarkdownRenderer`

## Converter details

### OpenCC bundled dictionaries

```typescript
import { Converter } from "opencc-js";

let _toTrad: Convert | null = null;  // Lazy singleton
function toTrad(text: string): string {
  _toTrad ??= Converter({ from: "cn", to: "tw" });
  return _toTrad(text);
}
```

**Why lazy?** The OpenCC dictionary (~1.1 MB uncompressed in the bundle) is expensive to parse on app startup. Initializing on first use defers the cost until a reader actually toggles 繁體.

**Dictionary variant:** `s2tw` (Simplified CN → Traditional Taiwan). Character forms only; no phrase-level localization (e.g., no term rewrites). Taiwan is the primary Traditional-reading Buddhist audience, and keeping the wording identical across scripts matters for scripture.

### Display vs. canonical form

**Display form** (`toDisplayScript`, used at render time):
- Applied to sutta body, UI strings, audio section titles, margin-note quotes.
- Only converts if `locale === "zh" && script === "hant"`.
- Non-Han characters (Latin, numbers, punctuation) pass through unchanged.

**Canonical form** (`toCanonicalScript`, used at storage):
- Applied to margin-note selections before they're stored in Supabase.
- Folded back to Simplified so the same note syncs correctly across web (always Simplified) and mobile (either script).
- Only converts if `locale === "zh" && script === "hant"`.

Both are identity otherwise (no allocation when not needed).

### Length preservation & offset alignment

OpenCC's `s2tw` is 1:1 character mapping — Simplified "长" (long) becomes Traditional "長"; no sequence expansion. This is critical for margin notes:

1. Reader selects text in Traditional: bytes 40–60 (5 glyphs).
2. `toCanonical` folds it back to Simplified (same 5 glyphs, same byte count).
3. Stored offset 40–60 matches the canonical source.
4. When another reader sees the same note on web (Simplified), the offset is byte-accurate.

Without 1:1 mapping, offsets would shift and highlights would misalign.

## Locale & script context

### `LocaleContext`

Tracks two dimensions: reading language (`locale: "en" | "zh"`) and Han script (`script: "hans" | "hant"`).

```typescript
type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  script: ChineseScript;     // only meaningful when locale === "zh"
  setScript: (script: ChineseScript) => void;
};
```

Both are persisted to AsyncStorage (`locale` key: `STORAGE_KEY = "locale"`, script key: `SCRIPT_KEY = "zh-script"`). Default is English + Simplified.

### `useZhConvert()` hook

Binds the current locale/script to the converters:

```typescript
const { isHant, toDisplay, toCanonical } = useZhConvert();
```

**`isHant`:** boolean shorthand (true iff `locale === "zh" && script === "hant"`).
**`toDisplay` / `toCanonical`:** useCallback-wrapped converters that respect `isHant`.

Non-zh surfaces see `isHant = false`, so `toDisplay(text)` and `toCanonical(text)` are identity functions — no cost.

## UI string conversion

### `useStrings()` hook

The app-wide UI strings (nav labels, buttons, section headings) come from the content package's `getStrings(locale)`, which returns the canonical Simplified copy. To render them in Traditional, the mobile app uses a **deep recursive converter**:

```typescript
export function useStrings(): ReturnType<typeof getStrings> {
  const { locale } = useLocale();
  const { isHant, toDisplay } = useZhConvert();
  return useMemo(
    () => (isHant ? deepConvert(getStrings(locale), toDisplay) : getStrings(locale)),
    [locale, isHant, toDisplay],
  );
}
```

**Performance:** When `isHant = false`, returns the canonical object as-is (no allocation). When `isHant = true`, `deepConvert` walks every leaf string and applies `toDisplay`, caching the result in `useMemo`.

**Why not per-string?** Calling `toDisplay` at every usage site would be repetitive and easy to miss. One memoized hook ensures consistency: all chrome text is converted the same way.

## Font selection for Chinese

### The problem

Latin reading fonts (GaramondLibre, Atkinson Hyperlegible) contain no CJK glyphs. When iOS renders Chinese with them, it **substitutes** system fallback glyphs for each Han character. Critically, those substitutions **ignore the explicit `fontSize` prop**, rendering at a system default instead. This breaks the Aa resize (size control has no effect).

### The solution

`readerFonts(font, locale)` in `tokens.ts` returns a locale-aware font set:

```typescript
export function readerFonts(font: "serif" | "accessible", locale: string): ReaderFontSet {
  if (locale === "zh") {
    return { body: CJK_SERIF, bold: CJK_SERIF, italic: CJK_SERIF, boldWeight: "700" };
  }
  // English: use GaramondLibre or Atkinson as chosen
  return font === "accessible"
    ? { body: FONTS.accessible, bold: FONTS.accessibleBold, italic: FONTS.accessibleItalic }
    : { body: FONTS.serif, bold: FONTS.serifBold, italic: FONTS.serifItalic };
}
```

**For zh:** Uses `CJK_SERIF`:
- **iOS:** "Songti SC" (宋体, a native serif font). Matches the Garamond reading voice; honors `fontSize` and `fontWeight`.
- **Android:** `undefined` (delegates to system CJK fallback, which also respects size).

**For en:** Uses the chosen font (serif or accessible).

One font family for zh means bold comes from `fontWeight: "700"` (CJK fonts have no separate weight faces; weight is a rendering directive). The `ReaderFontSet.boldWeight = "700"` flag signals this to `MarkdownRenderer`.

## Margin notes (selection storage)

### Flow

1. **Selection happens in Traditional** (or Simplified, depending on script pref).
2. **`useSuttaMarginalia.tsx` calls `toCanonical(selectedText, isHant)`** before storing.
3. **Stored canonical Simplified quote** syncs to Supabase.
4. **Web reader fetches the same note** (always sees Simplified).
5. **Mobile reader in Traditional** displays the stored Simplified quote **converted to Traditional** on render.

### Offset stability

The canonical Simplified quote is stored with its byte offset in the Simplified source. When rendering in Traditional:

1. Quote text displayed via `toDisplay(stored_quote)`.
2. The highlight offset is applied to the Traditional-rendered sutta body.
3. Because both the stored quote and the body are converted with the same 1:1 `s2tw` map, lengths match and the offset remains valid.

If quote text and body were converted separately with different dictionaries, they could diverge — avoiding that is why OpenCC's character-preserving map is essential.

## Important patterns & gotchas

### Avoid double-conversion

If a string is already the result of `toDisplay`, don't convert it again. All UI text should go through `useStrings()` once, not piece by piece.

**Good:**
```typescript
const strings = useStrings();  // one memoized convert
return <Text>{strings.nav.home}</Text>;
```

**Bad:**
```typescript
const { toDisplay } = useZhConvert();
return <Text>{toDisplay(getStrings(locale).nav.home)}</Text>;  // converts twice
```

### Non-Han text is unaffected

OpenCC ignores ASCII, numbers, punctuation, and CJK punctuation. A string like "SN 56.11 · 转法轮经" becomes "SN 56.11 · 轉法輪經" (only the last four characters convert). This works automatically — no special-casing needed.

### CJK font is locale-aware, not script-aware

The font switch uses `locale === "zh"`, not the script pref. Both hans and hant read in the same CJK face. This is intentional: switching from `hans` to `hant` is a *display toggle*, not a *language switch*, so it shouldn't change the font. The font choice is about "am I reading Chinese content" (yes for both scripts), not "which script am I reading" (hans or hant).

### Offline bundle size

OpenCC dict: ~1.1 MB uncompressed in the final bundle. Because initialization is lazy, this doesn't impact startup or app launch time — only a reader who toggles 繁體 incurs the cost. Consider noting this in release notes if bundle size is a concern.

## Audio manifest revalidation

See **`docs/architecture/mobile.md` "Audio … Offline download"** for the stale-while-revalidate pattern that keeps audio section titles fresh. The mobile app bundles a manifest snapshot at build time; when online, it fetches the live CDN copy in the background. If titles change post-release (e.g., a sutta is relabeled), the player's section list updates without requiring an app rebuild.

The same pattern applies to all content: sutta text, audio manifests, UI strings. Canonical source is always Simplified; display conversion happens at render time.
