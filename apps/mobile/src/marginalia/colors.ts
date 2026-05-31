/**
 * Highlight colors for Margin Notes.
 *
 * The web ships a single highlight wash — a warm amber, defined in globals.css
 * as `--color-highlight` (`rgba(213,150,64,0.34)` light / `rgba(224,131,58,0.30)`
 * dark) with a `-strong` hover/flash state. Every web mark is created with
 * `color: "amber"`, and the CSS renders that one wash regardless of the stored
 * value.
 *
 * Mobile keeps `amber` as the default (and reuses the web's exact RGBA values
 * for it) so a web↔mobile round-trip is visually identical, then adds a small
 * palette so a reader can colour-code marks. The `key` is what lands in the
 * `marginalia.color` column — a free-text string the web tolerates: an unknown
 * colour simply renders as the web's amber wash, so the data model stays
 * byte-compatible and nothing breaks cross-platform.
 */

import type { ThemeName } from "@/theme/tokens";

export type HighlightColorKey = "amber" | "rose" | "sky" | "sage" | "violet";

export const DEFAULT_HIGHLIGHT_COLOR: HighlightColorKey = "amber";

type Wash = { wash: string; strong: string; swatch: string };

/**
 * Per-theme wash (resting), strong (selected/flash), and an opaque swatch for
 * the picker. `amber` reuses the web's `--color-highlight` values verbatim.
 */
export const HIGHLIGHT_COLORS: Record<HighlightColorKey, Record<ThemeName, Wash>> = {
  amber: {
    light: { wash: "rgba(213,150,64,0.34)", strong: "rgba(213,150,64,0.55)", swatch: "#d59640" },
    dark: { wash: "rgba(224,131,58,0.30)", strong: "rgba(224,131,58,0.48)", swatch: "#e0833a" },
  },
  rose: {
    light: { wash: "rgba(201,86,86,0.30)", strong: "rgba(201,86,86,0.50)", swatch: "#c95656" },
    dark: { wash: "rgba(224,118,118,0.28)", strong: "rgba(224,118,118,0.46)", swatch: "#e07676" },
  },
  sky: {
    light: { wash: "rgba(70,130,180,0.30)", strong: "rgba(70,130,180,0.50)", swatch: "#4682b4" },
    dark: { wash: "rgba(110,160,205,0.28)", strong: "rgba(110,160,205,0.46)", swatch: "#6ea0cd" },
  },
  sage: {
    light: { wash: "rgba(106,141,90,0.30)", strong: "rgba(106,141,90,0.50)", swatch: "#6a8d5a" },
    dark: { wash: "rgba(140,176,122,0.28)", strong: "rgba(140,176,122,0.46)", swatch: "#8cb07a" },
  },
  violet: {
    light: { wash: "rgba(140,108,178,0.30)", strong: "rgba(140,108,178,0.50)", swatch: "#8c6cb2" },
    dark: { wash: "rgba(168,140,205,0.28)", strong: "rgba(168,140,205,0.46)", swatch: "#a88ccd" },
  },
};

export const HIGHLIGHT_COLOR_KEYS = Object.keys(HIGHLIGHT_COLORS) as HighlightColorKey[];

/** Normalize a stored color string to a known key (unknown → amber, web parity). */
export function resolveColorKey(color: string | null | undefined): HighlightColorKey {
  return color && color in HIGHLIGHT_COLORS
    ? (color as HighlightColorKey)
    : DEFAULT_HIGHLIGHT_COLOR;
}

/** The resting wash for a stored color in the current theme. */
export function highlightWash(color: string | null | undefined, theme: ThemeName): string {
  return HIGHLIGHT_COLORS[resolveColorKey(color)][theme].wash;
}

/** The opaque swatch for a stored color (picker chips, panel dots). */
export function highlightSwatch(color: string | null | undefined, theme: ThemeName): string {
  return HIGHLIGHT_COLORS[resolveColorKey(color)][theme].swatch;
}
