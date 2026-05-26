# Plain Dharma — Design Review

_Review date: 2026-05-25. Method: source + Tailwind config review, all six hero
illustrations rendered together on the `#f5efe0` paper background, and WCAG
contrast ratios computed against the actual palette (not eyeballed). The live
site was not run, so this is code + rendered-asset analysis._

## Overall impression

A confident, coherent design with a clear point of view — a "printed book on
the web" feel that genuinely suits the source material. The Garamond Libre +
warm-paper system is doing real work, and the editorial hero is an ambitious,
mostly-successful idea. The two biggest opportunities:

1. **Illustration consistency** — two of the six hero images break the visual
   system, and because they sit in the hero, they undercut the most polished
   part of the experience.
2. **Contrast on the warm palette** — several muted text tokens and the
   accent-as-link/small-text color fall below WCAG AA.

## Visual hierarchy

1. **What the eye hits first** is the six saturated orange illustrations, not
   the headline. For a site whose pitch _is_ "Old wisdom. Plain English.", the
   type arguably should win the first beat.
2. **The sandwich layout** (3 illustrations / headline / 3 illustrations) is
   elegant but splits attention — the eye has no single resting point. It works,
   but it's the riskiest part of the page.
3. **Reading pages are excellent.** Single 3xl column, centered illustration,
   Pāli eyebrow → title → italic subtitle → prose is a clean, correct descent.

## Consistency — priority finding

The six illustrations are not one set. Three styles are fighting:

1. **Minimal continuous-line** (clean, transparent): first-talk sunrise,
   not-self dissolving head, mindfulness eye. The intended style.
2. **Solid filled shape**: fire-sermon is a heavy filled flame — bolder weight
   than the line work.
3. **Sketchy + opaque background block**: loving-kindness and how-to-decide both
   sit on a visible tan rectangle (the transparency pass didn't take), and
   how-to-decide is rendered in a busier, multi-stroke style that matches
   nothing else.

| Element | Issue | Recommendation |
|---|---|---|
| loving-kindness.png, how-to-decide.png | Opaque rectangular background; breaks the float-on-paper effect | Re-run transparentize, or regenerate |
| how-to-decide.png | Different illustration style (sketchy/detailed vs. single-line) | Regenerate to match the continuous-line minimalism; simplify the prompt (drop "two open hands testing the weights") |
| fire-sermon.png | Filled solid vs. line elsewhere | Acceptable if intentional; a line-art flame would unify the set |
| Container widths | Header/Footer `max-w-5xl`, home `max-w-6xl`, reading `max-w-3xl` | Pick a deliberate scale; the 5xl-vs-6xl gap misaligns header edges with home content |

## Accessibility — measured contrast vs. `#f5efe0`

| Text | Ratio | AA verdict |
|---|---|---|
| Body ink `#1f1812` | 15.3:1 | pass |
| `ink/75` & `ink/70` muted prose | 7.2 / 6.0:1 | pass |
| Link rust `#8b3a0f` | 6.75:1 | pass |
| Accent `#c7651c` as h2 headings (24px, large) | 3.45:1 | pass (large ≥ 3:1) |
| Accent `#c7651c` as inline links / small eyebrows (≤17px) | 3.45:1 | FAIL (needs 4.5) |
| White on accent button (14px medium) | 3.96:1 | FAIL (needs 4.5) |
| `ink/60` section eyebrow | 4.39:1 | marginal fail |
| `ink/50` Prev/Next + small labels | 3.24:1 | FAIL |
| `ink/40` ordinal numbers "01–06" | 2.47:1 | FAIL |

Pattern: the system is sound, but the muted scale bottoms out too light, and
`#c7651c` is safe as a heading color but not as link or small text. Note the
irony that the darker rust (`#8b3a0f`, 6.75:1) is used only as the underline
decoration, while the link _text_ uses the failing accent.

Reference fixes:

- Inline/prose links → rust `#8b3a0f` (6.75:1).
- Button fill → deepen to `#b25916` (white-on = 4.85:1) — keeps the orange.
- Muted labels (ordinals, Prev/Next, section eyebrows) → `ink/65` (5.16:1).
- Small accent eyebrows → rust, or deepen the accent token to `#a8521a`
  (4.71:1 on paper, 5.40:1 white-on) to fix every accent usage at once.

## Usability

1. **CTA redundancy** — header (Read/About/Download) + hero buttons
   (Read/Download) + an inline "Read all six" link + the full list = four routes
   to "Read." The hero could trust the list more.
2. **Touch targets** — pill CTAs land ~40px tall; bump toward ~44px for mobile.
3. **Top eyebrow "Plain Dharma"** duplicates the logo two inches above it, and
   is the failing tiny-accent text. Consider cutting it.

## What works well

1. The type system — serif for content and headings, sans reserved for UI
   labels — is disciplined and consistently executed.
2. The warm paper palette is distinctive and thematically right.
3. Honest structure: semantic `header/nav/article/footer`, static generation,
   CC0 ethos reflected in the restraint.
4. The reading page is genuinely well-composed and needs almost nothing.

## Priority recommendations

1. **Unify the six illustrations.** Fix the two opaque-background images and
   regenerate how-to-decide (and ideally fire-sermon) in the continuous-line
   style. Highest leverage because the broken ones live in the hero.
2. **Fix the contrast floor.** Rust for links, deepen the button fill, darken
   the muted-label tokens, and resolve the accent-as-small-text usages.
3. **Let the headline win the first beat.** De-saturate/shrink the hero
   illustrations or move to a single row so "Old wisdom. Plain English." reads
   first.
