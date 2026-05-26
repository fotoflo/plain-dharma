import type { ComponentType } from "react";

export const SUTTAS = [
  "first-talk",
  "not-self",
  "fire-sermon",
  "loving-kindness",
  "mindfulness",
  "how-to-decide",
] as const;

export type SuttaSlug = (typeof SUTTAS)[number];

export const SUPPORTED_LOCALES = ["en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export type SuttaMeta = {
  slug: SuttaSlug;
  title: string;
  subtitle: string;
  ordinal: number;
  pali_name: string;
  teaser: string;
};

export const SUTTA_META: Record<SuttaSlug, SuttaMeta> = {
  "first-talk": {
    slug: "first-talk",
    title: "The Buddha's First Talk",
    subtitle:
      "His first teaching after waking up, given to five former companions in a deer park near Varanasi.",
    ordinal: 1,
    pali_name: "Dhammacakkappavattana Sutta",
    teaser:
      "The middle path, the four truths, and the eightfold way to live.",
  },
  "not-self": {
    slug: "not-self",
    title: "The Buddha's Second Talk",
    subtitle:
      "The Discourse on Not-Self, given to the same five seekers a few days after the first one.",
    ordinal: 2,
    pali_name: "Anattalakkhana Sutta",
    teaser:
      "Why the body, feelings, perceptions, and even awareness aren't you.",
  },
  "fire-sermon": {
    slug: "fire-sermon",
    title: "The Buddha's Third Talk: The Fire Sermon",
    subtitle:
      "Given on a hilltop near Gaya to a thousand former fire-worshipping ascetics.",
    ordinal: 3,
    pali_name: "Adittapariyaya Sutta",
    teaser:
      "Everything is on fire. What is burning, and how to cool down.",
  },
  "loving-kindness": {
    slug: "loving-kindness",
    title: "On Loving-Kindness",
    subtitle: "The Buddha's teaching on goodwill. Short, almost a poem.",
    ordinal: 4,
    pali_name: "Metta Sutta",
    teaser:
      "Hold the wish that every living thing, without exception, be at ease.",
  },
  mindfulness: {
    slug: "mindfulness",
    title: "The Foundations of Mindfulness",
    subtitle:
      "The Buddha's step-by-step guide to mindfulness, with its full original refrain.",
    ordinal: 5,
    pali_name: "Satipatthana Sutta",
    teaser:
      "Watch the body, feelings, mind, and contents of experience clearly.",
  },
  "how-to-decide": {
    slug: "how-to-decide",
    title: "How to Decide What to Believe",
    subtitle: "The Buddha's talk on thinking for yourself.",
    ordinal: 6,
    pali_name: "Kalama Sutta",
    teaser:
      "Don't take anything on authority. Test it for yourself, against what you can actually see.",
  },
};

export const SUTTAS_IN_ORDER: SuttaMeta[] = SUTTAS.map((s) => SUTTA_META[s]);

export function isSuttaSlug(value: string): value is SuttaSlug {
  return (SUTTAS as readonly string[]).includes(value);
}

export function getMeta(slug: SuttaSlug): SuttaMeta {
  return SUTTA_META[slug];
}

export function getNeighbors(slug: SuttaSlug): {
  prev: SuttaMeta | null;
  next: SuttaMeta | null;
} {
  const idx = SUTTAS.indexOf(slug);
  const prev = idx > 0 ? SUTTA_META[SUTTAS[idx - 1]] : null;
  const next =
    idx >= 0 && idx < SUTTAS.length - 1 ? SUTTA_META[SUTTAS[idx + 1]] : null;
  return { prev, next };
}

type MDXModule = { default: ComponentType };

const LOADERS: Record<Locale, Record<SuttaSlug, () => Promise<MDXModule>>> = {
  en: {
    "first-talk": () => import("./en/first-talk.mdx"),
    "not-self": () => import("./en/not-self.mdx"),
    "fire-sermon": () => import("./en/fire-sermon.mdx"),
    "loving-kindness": () => import("./en/loving-kindness.mdx"),
    mindfulness: () => import("./en/mindfulness.mdx"),
    "how-to-decide": () => import("./en/how-to-decide.mdx"),
  },
};

export async function loadSutta(
  locale: Locale,
  slug: SuttaSlug
): Promise<ComponentType> {
  const loader = LOADERS[locale]?.[slug];
  if (!loader) {
    throw new Error(`No content for ${locale}/${slug}`);
  }
  const mod = await loader();
  return mod.default;
}

export function getAvailableLocales(slug: SuttaSlug): Locale[] {
  return SUPPORTED_LOCALES.filter((loc) => Boolean(LOADERS[loc]?.[slug]));
}
