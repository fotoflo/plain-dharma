import type { MDXContent } from "mdx/types";

export const SUTTAS = [
  "first-talk",
  "not-self",
  "fire-sermon",
  "loving-kindness",
  "mindfulness",
  "how-to-decide",
] as const;

export type SuttaSlug = (typeof SUTTAS)[number];

export const SUPPORTED_LOCALES = ["en", "zh"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/**
 * Invariant fields — these do not change per locale.
 * `pali_name` is always Pali (the original language of the text), not translated.
 */
export type SuttaBase = {
  slug: SuttaSlug;
  ordinal: number;
  pali_name: string;
};

/**
 * Per-locale display strings — translated for each supported locale.
 * `kicker_override` lets a locale show its own canonical name (e.g. ZH
 * `转法轮经`) in the kicker slot above the title, in place of the Pali
 * `pali_name`. Falls back to `pali_name` when unset.
 */
export type SuttaDisplay = {
  title: string;
  subtitle: string;
  teaser: string;
  kicker_override?: string;
};

/**
 * Merged view used by consumers — `SuttaBase` joined with the locale-specific
 * `SuttaDisplay` for the requested locale.
 */
export type SuttaMeta = SuttaBase & SuttaDisplay;

const SUTTA_BASE: Record<SuttaSlug, SuttaBase> = {
  "first-talk": {
    slug: "first-talk",
    ordinal: 1,
    pali_name: "Dhammacakkappavattana Sutra",
  },
  "not-self": {
    slug: "not-self",
    ordinal: 2,
    pali_name: "Anattalakkhana Sutra",
  },
  "fire-sermon": {
    slug: "fire-sermon",
    ordinal: 3,
    pali_name: "Adittapariyaya Sutra",
  },
  "loving-kindness": {
    slug: "loving-kindness",
    ordinal: 4,
    pali_name: "Metta Sutra",
  },
  mindfulness: {
    slug: "mindfulness",
    ordinal: 5,
    pali_name: "Satipatthana Sutra",
  },
  "how-to-decide": {
    slug: "how-to-decide",
    ordinal: 6,
    pali_name: "Kalama Sutra",
  },
};

const SUTTA_DISPLAY: Record<Locale, Record<SuttaSlug, SuttaDisplay>> = {
  en: {
    "first-talk": {
      title: "The Buddha's First Talk",
      subtitle:
        "His first teaching after waking up, given to five former companions in a deer park near Varanasi.",
      teaser:
        "The middle path, the four truths, and the eightfold way to live.",
    },
    "not-self": {
      title: "The Buddha's Second Talk",
      subtitle:
        "The Discourse on Not-Self, given to the same five seekers a few days after the first one.",
      teaser:
        "Why the body, feelings, perceptions, and even awareness aren't you.",
    },
    "fire-sermon": {
      title: "The Buddha's Third Talk: The Fire Sermon",
      subtitle:
        "Given on a hilltop near Gaya to a thousand former fire-worshipping ascetics.",
      teaser:
        "Everything is on fire. What is burning, and how to cool down.",
    },
    "loving-kindness": {
      title: "On Loving-Kindness",
      subtitle: "The Buddha's teaching on goodwill. Short, almost a poem.",
      teaser:
        "Hold the wish that every living thing, without exception, be at ease.",
    },
    mindfulness: {
      title: "The Foundations of Mindfulness",
      subtitle:
        "The Buddha's step-by-step guide to mindfulness, with its full original refrain.",
      teaser:
        "Watch the body, feelings, mind, and contents of experience clearly.",
    },
    "how-to-decide": {
      title: "How to Decide What to Believe",
      subtitle: "The Buddha's talk on thinking for yourself.",
      teaser:
        "Don't take anything on authority. Test it for yourself, against what you can actually see.",
    },
  },
  zh: {
    "first-talk": {
      title: "佛陀的第一次开示",
      subtitle:
        "觉醒之后，他在瓦拉纳西附近的鹿野苑里，对从前的五位同伴讲了这场开示。",
      teaser:
        "中间的那条路、四个真相，以及该怎么活的八件事。",
      kicker_override: "转法轮经",
    },
    "not-self": {
      title: "佛陀的第二次开示",
      subtitle:
        "在第一次开示之后没几天，佛陀对同样那五位修行者讲了这一篇。",
      teaser:
        "身体、感受、心念——都不是你。",
      kicker_override: "无我相经",
    },
    "fire-sermon": {
      title: "佛陀的第三次开示：火的开示",
      subtitle:
        "在伽耶附近的一座山头上，对从前拜火的一千位修行者讲的。",
      teaser:
        "一切都在燃烧。烧的是什么，以及怎么冷下来。",
      kicker_override: "燃烧经",
    },
    "loving-kindness": {
      title: "关于慈心",
      subtitle: "佛陀关于善意的那段开示。很短，几乎像一首诗。",
      teaser:
        "在心里守住一个愿——愿每一个活着的生命，毫无例外，都安好。",
      kicker_override: "慈经",
    },
    mindfulness: {
      title: "觉察的四个根基",
      subtitle:
        "佛陀一步一步讲怎么保持觉察，原文里那段反复的句子完整保留。",
      teaser:
        "清清楚楚地看身体、感受、心，以及经验里发生的一切。",
      kicker_override: "念处经",
    },
    "how-to-decide": {
      title: "怎么决定该相信什么",
      subtitle: "佛陀关于自己用脑子想清楚的那段开示。",
      teaser:
        "不要凭权威接受任何东西。拿你自己亲眼看到的去验证它。",
      kicker_override: "卡拉玛经",
    },
  },
};

export function isSuttaSlug(value: string): value is SuttaSlug {
  return (SUTTAS as readonly string[]).includes(value);
}

export function getMeta(locale: Locale, slug: SuttaSlug): SuttaMeta {
  return { ...SUTTA_BASE[slug], ...SUTTA_DISPLAY[locale][slug] };
}

export function getNeighbors(
  locale: Locale,
  slug: SuttaSlug
): { prev: SuttaMeta | null; next: SuttaMeta | null } {
  const idx = SUTTAS.indexOf(slug);
  const prev = idx > 0 ? getMeta(locale, SUTTAS[idx - 1]) : null;
  const next =
    idx >= 0 && idx < SUTTAS.length - 1
      ? getMeta(locale, SUTTAS[idx + 1])
      : null;
  return { prev, next };
}

export function getSuttasInOrder(locale: Locale): SuttaMeta[] {
  return SUTTAS.map((s) => getMeta(locale, s));
}

type MDXModule = { default: MDXContent };

const LOADERS: Record<Locale, Record<SuttaSlug, () => Promise<MDXModule>>> = {
  en: {
    "first-talk": () => import("./en/first-talk.mdx"),
    "not-self": () => import("./en/not-self.mdx"),
    "fire-sermon": () => import("./en/fire-sermon.mdx"),
    "loving-kindness": () => import("./en/loving-kindness.mdx"),
    mindfulness: () => import("./en/mindfulness.mdx"),
    "how-to-decide": () => import("./en/how-to-decide.mdx"),
  },
  zh: {
    "first-talk": () => import("./zh/first-talk.mdx"),
    "not-self": () => import("./zh/not-self.mdx"),
    "fire-sermon": () => import("./zh/fire-sermon.mdx"),
    "loving-kindness": () => import("./zh/loving-kindness.mdx"),
    mindfulness: () => import("./zh/mindfulness.mdx"),
    "how-to-decide": () => import("./zh/how-to-decide.mdx"),
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

export function getAvailableLocales(slug: SuttaSlug): Locale[] {
  return SUPPORTED_LOCALES.filter((loc) => Boolean(LOADERS[loc]?.[slug]));
}
