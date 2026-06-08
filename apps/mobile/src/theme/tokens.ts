// Design tokens ported from the web's globals.css (the source of truth).
// Light = "cream paper", dark = "navy night sky".

import { Platform } from "react-native";

export type ThemeName = "light" | "dark";

export type Palette = {
  /** Page background (--color-bg). */
  bg: string;
  /** Body reading text (--color-text / --color-ink). */
  ink: string;
  /** Saffron accent — h2 headings, rules, blockquote bar (--color-accent-raw). */
  accent: string;
  /** Deeper saffron for interactive fills; white text clears WCAG AA. */
  accentStrong: string;
  /** Text/icon color on an accentStrong fill. */
  onAccent: string;
  /** Links (--color-link-raw). */
  link: string;
  /** Warm hairline dividers / hr (--color-border-warm). */
  divider: string;
};

export const PALETTE: Record<ThemeName, Palette> = {
  light: {
    bg: "#f5efe0",
    ink: "#1f1812",
    accent: "#c7651c",
    accentStrong: "#b25916",
    onAccent: "#ffffff",
    link: "#8b3a0f",
    divider: "#e0d4b8",
  },
  dark: {
    bg: "#101a30",
    ink: "#ece3d2",
    accent: "#e0833a",
    accentStrong: "#b25916",
    onAccent: "#ffffff",
    link: "#e0a05a",
    divider: "#283450",
  },
};

// ── Reader size → multiplier (mirrors --reading-scale in globals.css) ──────────
export type ReadingSize = "sm" | "md" | "lg" | "xl";
export const READING_SCALE: Record<ReadingSize, number> = {
  sm: 0.9,
  md: 1,
  lg: 1.15,
  xl: 1.35,
};

// ── Reader contrast → mode-aware ink + background override ────────────────────
// Ported from the web "contrast control" (globals.css). Each level sets the
// reading ink and, for some levels, overrides the screen background. "med"
// equals the theme default (no change). Light-high brightens paper to white;
// dark low/high drop to flat black (the web also suppresses its star field
// there). CONTRAST_BG null = keep the theme's default bg.
export type Contrast = "low" | "med" | "high";
export const CONTRAST_INK: Record<ThemeName, Record<Contrast, string>> = {
  light: { low: "#5c4d3a", med: "#1f1812", high: "#000000" },
  dark: { low: "#9a9285", med: "#ece3d2", high: "#ffffff" },
};
export const CONTRAST_BG: Record<ThemeName, Record<Contrast, string | null>> = {
  light: { low: null, med: null, high: "#ffffff" },
  dark: { low: "#000000", med: null, high: "#000000" },
};

export type ReadingFont = "serif" | "accessible";

// Mobile baseline reading type. Web ramps 17→19px across breakpoints; we take
// the 17px mobile base and scale by READING_SCALE. line-height 1.75 per
// .prose-dharma.
export const BASE_FONT_SIZE = 17;
export const BASE_LINE_HEIGHT = 1.75;

// Font-family names registered via expo-font in app/_layout. Garamond Libre is
// the reading face; Atkinson Hyperlegible (via @expo-google-fonts) backs the
// accessible font-switch option. Names must match the useFonts() keys.
export const FONTS = {
  serif: "GaramondLibre",
  serifBold: "GaramondLibre-Bold",
  serifItalic: "GaramondLibre-Italic",
  serifBoldItalic: "GaramondLibre-BoldItalic",
  accessible: "AtkinsonHyperlegible_400Regular",
  accessibleBold: "AtkinsonHyperlegible_700Bold",
  accessibleItalic: "AtkinsonHyperlegible_400Regular_Italic",
} as const;

// The reading fonts above (Garamond/Atkinson) are Latin-only — they have no CJK
// glyphs. Rendering Chinese with them makes iOS *substitute* a fallback face for
// each glyph, and that substitution doesn't honour the explicit point size, so
// the Aa resize silently does nothing for zh. Render zh with a real CJK face
// instead: iOS exposes "Songti SC" (宋体, a serif that matches the Garamond
// reading voice) by name without bundling; Android resolves CJK via its own
// system fallback when the family is left undefined. One family covers bold via
// fontWeight (CJK has no separate bold face and no italic).
const CJK_SERIF = Platform.select({ ios: "Songti SC", default: undefined });

export type ReaderFontSet = {
  body: string | undefined;
  bold: string | undefined;
  italic: string | undefined;
  /** Set for zh: there's one CJK family, so bold comes from weight, not face. */
  boldWeight?: "700";
};

/** Reader font set for the active locale + font preference. */
export function readerFonts(
  font: "serif" | "accessible",
  locale: string
): ReaderFontSet {
  if (locale === "zh") {
    return { body: CJK_SERIF, bold: CJK_SERIF, italic: CJK_SERIF, boldWeight: "700" };
  }
  return font === "accessible"
    ? { body: FONTS.accessible, bold: FONTS.accessibleBold, italic: FONTS.accessibleItalic }
    : { body: FONTS.serif, bold: FONTS.serifBold, italic: FONTS.serifItalic };
}
