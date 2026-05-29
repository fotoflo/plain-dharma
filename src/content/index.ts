// Web shim over the shared @plain-dharma/content registry.
//
// The canonical, platform-agnostic content + registry lives in the
// `@plain-dharma/content` workspace package (shared with the Expo app). This
// file re-exports all of it and adds the only web-specific piece: the Next.js
// MDX `LOADERS` (dynamic `import()` of compiled `.mdx`) and `loadSutta`. Those
// can't live in the package because they depend on @next/mdx compiling the
// `.mdx` files into React components (see `transpilePackages` in next.config.ts);
// mobile instead inline-imports the same `.mdx` files as raw strings.
import type { MDXContent } from "mdx/types";
import type { Locale, SuttaSlug } from "@plain-dharma/content";

export * from "@plain-dharma/content";

type MDXModule = { default: MDXContent };

const LOADERS: Record<Locale, Record<SuttaSlug, () => Promise<MDXModule>>> = {
  en: {
    "first-talk": () => import("@plain-dharma/content/en/first-talk.mdx"),
    "not-self": () => import("@plain-dharma/content/en/not-self.mdx"),
    "fire-sermon": () => import("@plain-dharma/content/en/fire-sermon.mdx"),
    "loving-kindness": () =>
      import("@plain-dharma/content/en/loving-kindness.mdx"),
    mindfulness: () => import("@plain-dharma/content/en/mindfulness.mdx"),
    "how-to-decide": () => import("@plain-dharma/content/en/how-to-decide.mdx"),
  },
  zh: {
    "first-talk": () => import("@plain-dharma/content/zh/first-talk.mdx"),
    "not-self": () => import("@plain-dharma/content/zh/not-self.mdx"),
    "fire-sermon": () => import("@plain-dharma/content/zh/fire-sermon.mdx"),
    "loving-kindness": () =>
      import("@plain-dharma/content/zh/loving-kindness.mdx"),
    mindfulness: () => import("@plain-dharma/content/zh/mindfulness.mdx"),
    "how-to-decide": () => import("@plain-dharma/content/zh/how-to-decide.mdx"),
  },
};

export async function loadSutta(
  locale: Locale,
  slug: SuttaSlug
): Promise<MDXContent> {
  const loader = LOADERS[locale]?.[slug];
  if (!loader) {
    throw new Error(`No content for ${locale}/${slug}`);
  }
  const mod = await loader();
  return mod.default;
}
