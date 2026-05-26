# Plain Dharma — logo handoff (for Figma)

## Wordmark
Two fonts, sharing one baseline, no `.com`:

| Part | Font | Weight | Color | Notes |
|------|------|--------|-------|-------|
| Plain | Geist (sans) | Bold (700) | Saffron `#C7651C` | Bigger of the two; tracking ≈ −0.01em |
| Dharma | Garamond Libre (serif) | Regular/Medium | Ink `#1F1812` | ~85% the cap height of "Plain" |

In the current build "Plain" is `1.6rem`, "Dharma" `1.35rem`, baseline-aligned, run together (no space).

## Mark
A soft saffron watercolor disc (circle #1 from the explored set). It sits left of
the wordmark, roughly cap-height of "Plain" or a touch taller, vertically centered
on the wordmark. Gap ≈ 8px at header size.

Note: the disc has a light center, so it can wash out small on the paper background.
In Figma, try deepening the center / increasing saturation, or adding a subtle
darker rim so it holds at 20–36px.

## Palette
- Paper background `#F5EFE0`
- Ink (text) `#1F1812`
- Saffron (brand) `#C7651C`
- Deeper saffron (interactive fills) `#B25916`
- Rust (links) `#8B3A0F`

## Source assets (in this repo)
- `public/logo/mark.png` — the watercolor disc currently in use (256×302, transparent)
- `public/logo/sun-a.svg` … `sun-d.svg` — vector sun marks (D = disc only, used as favicon `src/app/icon.svg`)
- Exploration sprites (in the working outputs, ask to re-export): 12 watercolor circles, 12 ensōs

## Fonts to load in Figma
- Geist — https://vercel.com/font (or the `geist` npm package: `node_modules/geist/dist/fonts/geist-sans/`)
- Garamond Libre — repo files at `src/app/fonts/GaramondLibre-*.otf`
