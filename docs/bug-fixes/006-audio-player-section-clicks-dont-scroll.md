# Bug Fix: Audio Player Section Clicks Don't Scroll the Page

**Date**: 2026-05-27
**Severity**: Low — scroll-to-section feature partially broken, no visual feedback

---

## Symptom

On `/first-talk`, clicking section rows in the audio player list (e.g., "The Four Noble Truths") should scroll the page to the corresponding heading. It worked for H2 sections but failed silently for "Title", "Preface", "Opening", and "Drop" — the first three and last entry in the manifest.

---

## Root Cause

Three converging issues:

1. **MDX-rendered H2s had no `id` attributes.** The content pipeline didn't use `rehype-slug`, so even H2 sections didn't have scroll targets. The scroll logic tried to find elements by ID, but none existed.

2. **Synthetic sections (title, preface, opening, drop) map to page elements, not MDX headings.** These sections don't have corresponding H2 markdown headings — they map to:
   - `title` → page `<header>`
   - `preface` → the `<Preface />` editorial component
   - `opening` → the main `<article>` container
   - `drop` → the `<Drop />` component at the end

   None of these wrapper elements had `id` attributes, so the scroll logic had nothing to target.

3. **Scroll logic race condition.** `handleSectionClick` had its own inline `scrollIntoView` call racing the `useEffect`-based scroll that watched `currentIdx`. Two competing scroll operations could fight each other or miss events.

---

## The Fix

Three coordinated changes:

### 1. Add `rehype-slug` to MDX plugins so H2s get IDs

**Before** (`next.config.ts`):

```ts
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});
```

**After** (`next.config.ts`):

```ts
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [["rehype-slug"]],  // ← generates id="section-title-slug" for all headings
  },
});
```

This automatically converts all MDX `## Heading` lines to `<h2 id="heading">...</h2>`.

### 2. Add explicit IDs to synthetic section wrapper elements

**Before** (`src/app/[slug]/page.tsx`):

```tsx
<header>
  <h1>{meta.title}</h1>
  <p>{meta.subtitle}</p>
</header>

<Preface slug={slug} />

<article>
  <MDXContent components={components} />
</article>

<Drop slug={slug} />
```

**After** (`src/app/[slug]/page.tsx`):

```tsx
<header id="title" className="scroll-mt-8">
  <h1>{meta.title}</h1>
  <p>{meta.subtitle}</p>
</header>

<div id="preface" className="scroll-mt-8">
  <Preface slug={slug} />
</div>

<article id="opening" className="scroll-mt-8">
  <MDXContent components={components} />
</article>

<div id="drop" className="scroll-mt-8">
  <Drop slug={slug} />
</div>
```

The `id` attributes match the manifest section names. The `scroll-mt-8` class adds top margin to the scroll target so it doesn't land right at the viewport edge (improves readability).

### 3. Remove the inline scroll in handleSectionClick

**Before** (`src/components/AudioPlayer.tsx`):

```tsx
const handleSectionClick = (index: number, sectionId: string) => {
  setCurrentIdx(index);
  
  // ← inline scroll, races with useEffect
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

useEffect(() => {
  // ← effect-based scroll, also runs on currentIdx change
  const section = sections[currentIdx];
  const element = document.getElementById(section.id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
}, [currentIdx]);
```

**After** (`src/components/AudioPlayer.tsx`):

```tsx
const handleSectionClick = (index: number) => {
  setCurrentIdx(index);
  // ← remove the inline scroll; rely on useEffect below
};

useEffect(() => {
  // ← single source of truth for scroll behavior
  const section = sections[currentIdx];
  const element = document.getElementById(section.id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
}, [currentIdx, sections]);
```

Now there's only one scroll operation per section click, driven by the state change. No races, no double-scrolls.

---

## Key Rule

**For section-anchored scrolling to work uniformly, every audio section ID in the manifest must map to a DOM element `id` on the page.** This includes:
- H2 headings from MDX (use `rehype-slug` to auto-generate)
- Synthetic sections that don't have headings (add explicit `id` attributes)

Also: **single source of truth for scroll behavior.** Use a `useEffect` that watches the state variable (`currentIdx`, `currentSectionId`, etc.), not inline imperative calls in event handlers. This prevents races and makes the scroll logic testable.

---

## Files Involved

- `next.config.ts` — added `["rehype-slug"]` to `rehypePlugins`
- `src/app/[slug]/page.tsx` — added `id` attributes and `scroll-mt-8` class to section wrapper elements
- `src/components/AudioPlayer.tsx` — removed inline scroll from `handleSectionClick`, relied entirely on `useEffect` watching `currentIdx`
