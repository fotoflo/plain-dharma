# Bug Fix: MDX YAML Frontmatter Rendered as Visible Text

**Date**: 2026-05-26
**Severity**: High — visible on every teaching page and the `/read` index

---

## Symptom

On `/read` and per-teaching pages, YAML frontmatter appeared as a giant orange paragraph at the top of each teaching:

```
slug: first-talk title: ... pali_name: Dhammacakkappavattana Sutta
```

Instead of being silently parsed as metadata, the raw YAML lines were flowing through as visible text content.

---

## Root Cause

`@next/mdx` does not strip YAML frontmatter by default. Frontmatter is a Markdown extension (GFM), not MDX standard. Without a remark plugin registered, the YAML block flows through the pipeline as literal text content and is rendered as a paragraph.

**Compounding issue — Turbopack serialization boundary**: The first attempted fix imported `remarkFrontmatter` directly and passed it as a function reference:

```ts
// BROKEN on Turbopack
import remarkFrontmatter from "remark-frontmatter";

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkFrontmatter],
  },
});
```

Turbopack threw `loader options not serializable` because plugin options must cross the JS-to-Rust boundary as plain serializable values — function references are not allowed. The bare-string form `["remark-frontmatter"]` worked for `pnpm build` (webpack code path) but failed for `pnpm dev` (Turbopack code path).

---

## The Fix

Use the **array-of-arrays** form with the YAML option. This keeps everything serializable for Turbopack.

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
    // Turbopack requires plugin names as strings, not function references
    remarkPlugins: [["remark-frontmatter", ["yaml"]]],
    rehypePlugins: [],
  },
});
```

Also added the dependency:

```bash
pnpm add remark-frontmatter
```

---

## Key Rule

For any remark/rehype plugin in a Next.js MDX pipeline with Turbopack, always use the array-of-arrays syntax `[["plugin-name", ...options]]` — never import the function directly. The bare-string form may work in webpack mode but breaks on Turbopack.

---

## Files Involved

- `next.config.ts` — plugin registration
- `package.json` — added `remark-frontmatter` dependency
