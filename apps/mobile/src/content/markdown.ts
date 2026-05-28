import type { Locale, SuttaSlug } from "@plain-dharma/content";

// Raw Markdown bodies, inlined as strings at build time by
// babel-plugin-inline-import (see babel.config.js). The shared `.mdx` files are
// plain Markdown (no JSX); the YAML frontmatter is stripped at read time.
//
// These use relative paths into packages/content rather than the package's
// `exports` because babel-plugin-inline-import only resolves *relative*
// specifiers, and the transform must run under this app's babel config.
import enFirstTalk from "../../../../packages/content/en/first-talk.mdx";
import enNotSelf from "../../../../packages/content/en/not-self.mdx";
import enFireSermon from "../../../../packages/content/en/fire-sermon.mdx";
import enLovingKindness from "../../../../packages/content/en/loving-kindness.mdx";
import enMindfulness from "../../../../packages/content/en/mindfulness.mdx";
import enHowToDecide from "../../../../packages/content/en/how-to-decide.mdx";
import zhFirstTalk from "../../../../packages/content/zh/first-talk.mdx";
import zhNotSelf from "../../../../packages/content/zh/not-self.mdx";
import zhFireSermon from "../../../../packages/content/zh/fire-sermon.mdx";
import zhLovingKindness from "../../../../packages/content/zh/loving-kindness.mdx";
import zhMindfulness from "../../../../packages/content/zh/mindfulness.mdx";
import zhHowToDecide from "../../../../packages/content/zh/how-to-decide.mdx";

const RAW: Record<Locale, Record<SuttaSlug, string>> = {
  en: {
    "first-talk": enFirstTalk,
    "not-self": enNotSelf,
    "fire-sermon": enFireSermon,
    "loving-kindness": enLovingKindness,
    mindfulness: enMindfulness,
    "how-to-decide": enHowToDecide,
  },
  zh: {
    "first-talk": zhFirstTalk,
    "not-self": zhNotSelf,
    "fire-sermon": zhFireSermon,
    "loving-kindness": zhLovingKindness,
    mindfulness: zhMindfulness,
    "how-to-decide": zhHowToDecide,
  },
};

/** Strip a leading YAML frontmatter block (`--- ... ---`) if present. */
export function stripFrontmatter(src: string): string {
  const text = src.charCodeAt(0) === 0xfeff ? src.slice(1) : src;
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(text);
  return (match ? text.slice(match[0].length) : text).replace(/^\s+/, "");
}

/** The plain-Markdown body of a sutta for the given locale, frontmatter removed. */
export function getSuttaMarkdown(locale: Locale, slug: SuttaSlug): string {
  return stripFrontmatter(RAW[locale][slug]);
}
