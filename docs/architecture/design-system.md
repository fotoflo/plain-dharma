# Design System — Plain Dharma

*Last updated: 2026-05-28*

Reading-first. Every decision optimizes for long-form prose on a range of
screens. No dark mode at launch was an early principle; dark mode was
subsequently added with a night-sky aesthetic distinct from the paper day mode.

## Palette

Defined as raw CSS custom properties in `:root`/`.dark` inside `globals.css`,
then aliased into Tailwind's `@theme inline` block so utility classes like
`bg-paper` and `text-accent` resolve directly.

| Token | Light | Dark | Utility class | Use |
|---|---|---|---|---|
| `--color-bg` | `#F5EFE0` | `#101A30` | `bg-paper` | Page background |
| `--color-text` | `#1F1812` | `#ECE3D2` | `text-ink` | Body copy |
| `--color-accent-raw` | `#C7651C` | `#E0833A` | `text-accent` / `bg-accent` | Saffron — logo, h2, CTAs |
| `--color-accent-strong-raw` | `#B25916` | `#B25916` | `bg-accent-strong` | Interactive fills (WCAG AA contrast) |
| `--color-link-raw` | `#8B3A0F` | `#E0A05A` | `text-link` | Links, hover emphasis |
| `--color-border-warm` | `#E0D4B8` | `#283450` | `border-divider` | Dividers, section rules |

Dark mode is activated by the `.dark` class on `<html>` (set by `ThemeToggle`
on click; initialized before first paint via an inline script in `layout.tsx`).
Overriding the six `--color-*` raw tokens cascades to every derived shadcn
token automatically, since those are defined as `var()` references.

## Typography

**Body / headings: Garamond Libre** — four OTF weights (Regular 400, Italic,
Bold 700, Bold Italic) loaded via `next/font/local`. CSS variable:
`--font-garamond` → mapped to `--font-serif` in Tailwind theme.

**UI: Geist Sans** — loaded via the `geist` npm package
(`GeistSans` from `geist/font/sans`). CSS variable: `--font-geist-sans` →
`--font-sans`.

Body uses `font-family: var(--font-serif)` by default. Nav, footer, labels,
small caps, and any non-reading UI use `font-sans`.

**Responsive font ramp** (body and `.prose-dharma` match exactly):

| Breakpoint | Size |
|---|---|
| Mobile (< 640px) | 17px |
| sm (≥ 640px) | 17.5px |
| md (≥ 768px) | 18px |
| lg (≥ 1024px) | 19px |

**Reading width:** `max-width: 68ch` on `.prose-dharma`. Line-height 1.75 on
mobile, 1.8 on md+.

## Key files

| File | Role |
|---|---|
| `src/app/globals.css` | All CSS custom properties, `@theme inline` aliases, `.prose-dharma` component class, dark theme overrides |
| `src/app/layout.tsx` | Font loading (`localFont` + `GeistSans`), injects `themeInitScript` in `<head>` |
| `src/app/fonts/` | Four Garamond Libre OTF files (Regular, Italic, Bold, BoldItalic) |
| `src/components/ThemeToggle.tsx` | Toggle button + `themeInitScript` export (flicker-free theme init) |
| `src/components/Wash.tsx` | Saffron watercolor wash decoration |
| `src/components/NightSky.tsx` | Animated canvas star field (dark mode only) |

## Components

### `.prose-dharma`
Custom CSS component class (not shadcn `prose`) for reading pages. Defines
heading hierarchy, blockquote style (left border in saffron), HR (narrow
centered rule), link style, and all responsive sizing. Applied as
`<article className="prose-dharma">` wrapping the rendered MDX.

### `Wash`
Absolutely-positioned decorative element. Props: `size` (sm/md/lg), `position`
(8 named positions), `intensity` (0.06–0.18, clamped). Internally: a
`radial-gradient` in saffron with a heavy Gaussian blur, layered with an inline
SVG `feTurbulence` filter at 3% opacity for paper-grain texture. Parent must
be `position: relative` + `overflow: hidden` to clip correctly.

### `NightSky`
Client component. Renders a fixed `<canvas>` behind all content (z-index 0;
content sits at z-index 10). Only paints in dark mode; clears to transparent
in light mode. 110 stars with per-star twinkle (sine wave), slow parallax
drift, and two faint nebula radial gradients (indigo + teal). Honors
`prefers-reduced-motion` by painting a single static frame.

### `ThemeToggle`
Client component. Uses `useSyncExternalStore` to sync with `localStorage` and
a custom `"themechange"` DOM event. The `themeInitScript` string (exported from
the same file) is injected into `<head>` as a `dangerouslySetInnerHTML` script
to apply the saved/system theme before first paint, preventing flash.

### `ReadingControls`
Client component. Floating "Aa" panel (top-right on desktop, bottom-right on
mobile) with three controls: **SIZE** (sm/md/lg/xl), **CONTRAST** (low/med/high),
and **FONT** (serif/accessible). Each setting persists to `localStorage` and is
applied via HTML class names managed by `useSyncExternalStore`. The component
dispatches `readingsizechange`, `readingcontrastchange`, and `readingfontchange`
events to notify other components of changes. Uses the same FOUC-prevention
pattern as `ThemeToggle` — the `readingPrefsInitScript` is injected into
`<head>` to apply all three classes before React hydrates, preventing flicker.

## Reading Controls System

The three user-facing reading controls—**SIZE**, **CONTRAST**, and **FONT**—use
dedicated CSS custom properties and class-based state to scale, recolor, and
restyle prose independently from UI chrome (nav, footer, controls panel itself).

### Size Control (`--reading-scale`)

`ReadingControls` allows users to choose from four scale options: **sm** (0.9×),
**md** (1.0×, default), **lg** (1.15×), and **xl** (1.35×). Each option applies
a class `reading-size-{sm|md|lg|xl}` to `<html>`, which sets the `--reading-scale`
CSS custom property.

The `.prose-dharma` prose component multiplies its `font-size` by `var(--reading-scale)`
at every breakpoint, so the responsive ramp scales proportionally. The `reading-head`
class (applied to headers outside `.prose-dharma`) sets `font-size: calc(1rem * var(--reading-scale))`
as a scale anchor; its children (`h1`, `h2`, `p`) use `em` units, so they inherit
the scaling. Editorial components (`.preface-dharma`, `.closing-dharma`, `.drop-dharma`)
also use `em`-based sizes with `var(--reading-scale)` to stay synchronized.

### Contrast Control (`--reading-ink` + `--color-bg`)

`ReadingControls` offers three contrast levels: **low** (soft/minimal glare),
**med** (default), and **high** (max legibility). Each applies a class
`contrast-{low|med|high}` to `<html>`, which drives two CSS custom properties:

**`--reading-ink`**: The color of all reading content (prose, blockquotes, headings,
editorial notes). This does NOT affect `--color-text`, which is reserved for UI
chrome (nav, footer, the controls panel). This decoupling is intentional—changing
the reading contrast only recolors the text the user is reading, not buttons and
labels.

**`--color-bg`**: In light mode, stays at the paper default (#F5EFE0) except in
high-contrast mode, which brightens it to pure white for maximum contrast. In
dark mode, low and high contrast modes drop to flat black (#000000) to minimize
glare/flicker; med mode keeps the navy background (#101A30).

| Mode | Contrast | `--reading-ink` | `--color-bg` | Use |
|---|---|---|---|---|
| Light | low | `#5c4d3a` (warm sepia) | `#F5EFE0` (paper) | Gentle daytime reading, low glare |
| Light | med | `#1F1812` (deep brown) | `#F5EFE0` (paper) | Default |
| Light | high | `#000000` (pure black) | `#FFFFFF` (white) | Low-vision, high contrast |
| Dark | low | `#9A9285` (dim warm grey) | `#000000` (black) | Night reading, minimal strain |
| Dark | med | `#ECE3D2` (warm off-white) | `#101A30` (navy) | Default with night sky |
| Dark | high | `#FFFFFF` (white) | `#000000` (black) | Maximum legibility |

**NightSky suppression:** In dark mode, the decorative animated star field
(`NightSky.tsx`) is suppressed when in `contrast-low` or `contrast-high` mode,
because those modes use flat-black backgrounds. The component detects these
classes and clears the canvas instead of rendering, allowing the pure-black
`--color-bg` to show through without animation interference.

### Font Control (`--font-accessible` + unlayered rules)

Users can choose **serif** (Garamond Libre, the default) or **accessible**
(Atkinson Hyperlegible, designed for low-vision readers). Each applies a class
`font-{serif|accessible}-pref` to `<html>`.

The accessible font is controlled by unlayered CSS rules in `globals.css` that
target prose components directly:

```css
html.font-accessible-pref .prose-dharma,
html.font-accessible-pref .preface-dharma,
html.font-accessible-pref .closing-dharma,
html.font-accessible-pref .drop-dharma {
  font-family: var(--font-accessible), system-ui, sans-serif;
}
html.font-accessible-pref .reading-head :where(h1, h2, p) {
  font-family: var(--font-accessible), system-ui, sans-serif;
}
```

Unlayered rules have high specificity and override component-level `font-serif`
utilities, ensuring the choice reaches all reading surfaces—prose, editorial
notes, and headers.

### Key files

| File | Role |
|---|---|
| `src/components/ReadingControls.tsx` | Floating control panel; manages size, contrast, font state via `useSyncExternalStore` and localStorage |
| `src/app/globals.css` | All CSS custom properties, `--reading-scale`, `--reading-ink`, contrast levels, and `.reading-head` scale anchor |
| `src/app/layout.tsx` | Injects `readingPrefsInitScript` into `<head>` to apply saved size/contrast/font classes before hydration |
| `src/views/SuttaView.tsx`, `src/views/ReadView.tsx` | Apply `reading-head` class to headers so they scale with the size control |

## Important patterns and gotchas

**Tailwind v4 `@theme inline`** — the `inline` modifier makes CSS variables
resolve at compile time. Token names under `@theme inline` must mirror the
`--color-*` names exactly, and they reference `var()` pointers to the live
custom properties so dark-mode overrides cascade correctly.

**shadcn tokens are wired to plain-dharma tokens** — `--primary`,
`--background`, `--border`, etc. are all set as `var(--color-*)` references.
Adding a new semantic color should follow this two-step pattern: define the raw
value in `:root`/`.dark`, then alias it in `@theme inline`.

**WCAG AA contrast note** — `--color-accent-raw` (#C7651C) is 3.96:1 on paper,
which fails AA for body text. `--color-accent-strong-raw` (#B25916) is 4.85:1
and is used for interactive fills where white text appears on a saffron
background.

**Reading contrast is isolated from UI chrome** — The `CONTRAST` control modifies
`--reading-ink` (used only by `.prose-dharma`, `.preface-dharma`, `.closing-dharma`,
`.drop-dharma`, and `.reading-head`) and `--color-bg` (the page background).
It does NOT change `--color-text`, which is reserved for UI chrome (nav, footer,
buttons). This means adjusting reading contrast never accidentally recolors the
controls panel or makes navigation harder to read.
