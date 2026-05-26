# Design System — Plain Dharma

*Last updated: 2026-05-26*

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
