import type { Locale, SuttaSlug } from "./index";

import firstTalk from "./pali/first-talk.json";
import notSelf from "./pali/not-self.json";
import fireSermon from "./pali/fire-sermon.json";
import lovingKindness from "./pali/loving-kindness.json";
import mindfulness from "./pali/mindfulness.json";
import howToDecide from "./pali/how-to-decide.json";

import sjFirstTalk from "./sujato/first-talk.json";
import sjNotSelf from "./sujato/not-self.json";
import sjFireSermon from "./sujato/fire-sermon.json";
import sjLovingKindness from "./sujato/loving-kindness.json";
import sjMindfulness from "./sujato/mindfulness.json";
import sjHowToDecide from "./sujato/how-to-decide.json";

// Pāli span ↔ plain-passage alignments kept as data files (one per sutta) so
// this module stays readable. first-talk + loving-kindness are authored inline
// below; the rest live in align/{slug}.json.
import alignNotSelf from "./align/not-self.json";
import alignFireSermon from "./align/fire-sermon.json";
import alignMindfulness from "./align/mindfulness.json";
import alignHowToDecide from "./align/how-to-decide.json";

/**
 * Parallel source-text view ("/[slug]/source"): the CC0 root Pāli laid out
 * beside our plain-English retelling, section by section — a split-diff for
 * readers who want to see what the original actually says.
 *
 * The Pāli is the Mahāsaṅgīti Tipiṭaka (CC0), fetched from SuttaCentral's
 * bilara-data by `scripts/fetch-pali.ts` into `pali/{slug}.json` as a map of
 * segment id → Pāli text (e.g. "snp1.8:1.1"). We never edit those files by
 * hand — re-run the script to refresh. Alignment to our prose lives in
 * ALIGNMENT below: each row names a contiguous span of segment ids and the
 * plain-English passage it corresponds to. The original is segmented far more
 * finely than we paraphrase, so a row groups several Pāli segments per chunk.
 */

/** Fetched root-Pāli segment maps, keyed by slug. Order of keys = document order. */
const PALI_SEGMENTS: Record<SuttaSlug, Record<string, string>> = {
  "first-talk": firstTalk as Record<string, string>,
  "not-self": notSelf as Record<string, string>,
  "fire-sermon": fireSermon as Record<string, string>,
  "loving-kindness": lovingKindness as Record<string, string>,
  mindfulness: mindfulness as Record<string, string>,
  "how-to-decide": howToDecide as Record<string, string>,
};

/** Bhikkhu Sujato's English translation, segmented by the same ids as the Pāli. */
const SUJATO_SEGMENTS: Record<SuttaSlug, Record<string, string>> = {
  "first-talk": sjFirstTalk as Record<string, string>,
  "not-self": sjNotSelf as Record<string, string>,
  "fire-sermon": sjFireSermon as Record<string, string>,
  "loving-kindness": sjLovingKindness as Record<string, string>,
  mindfulness: sjMindfulness as Record<string, string>,
  "how-to-decide": sjHowToDecide as Record<string, string>,
};

/**
 * SuttaCentral provenance per sutta, surfaced on the page + in structured data.
 * `name` is the Pāli title in proper Pāli spelling ("Sutta", not the registry's
 * Sanskrit "Sutra") — it's the high-intent search term these pages target.
 */
export const PALI_SOURCE: Record<
  SuttaSlug,
  { scId: string; ref: string; name: string }
> = {
  "first-talk": {
    scId: "sn56.11",
    ref: "SN 56.11",
    name: "Dhammacakkappavattana Sutta",
  },
  "not-self": {
    scId: "sn22.59",
    ref: "SN 22.59",
    name: "Anattalakkhaṇa Sutta",
  },
  "fire-sermon": {
    scId: "sn35.28",
    ref: "SN 35.28",
    name: "Ādittapariyāya Sutta",
  },
  "loving-kindness": { scId: "snp1.8", ref: "Snp 1.8", name: "Mettā Sutta" },
  mindfulness: { scId: "mn10", ref: "MN 10", name: "Satipaṭṭhāna Sutta" },
  "how-to-decide": { scId: "an3.65", ref: "AN 3.65", name: "Kālāma Sutta" },
};

/** Canonical SuttaCentral URL for a sutta's root text (provenance link). */
export function suttaCentralUrl(slug: SuttaSlug): string {
  return `https://suttacentral.net/${PALI_SOURCE[slug].scId}/pli/ms`;
}

export const PALI_LICENSE = {
  edition: "Mahāsaṅgīti Tipiṭaka Buddhavasse 2500",
  license: "CC0 1.0 (Public Domain)",
  via: "SuttaCentral",
  url: "https://suttacentral.net",
} as const;

export const SUJATO_LICENSE = {
  translator: "Bhikkhu Sujato",
  license: "CC-BY 4.0",
  via: "SuttaCentral",
  url: "https://suttacentral.net",
} as const;

/** One row of the parallel view: a Pāli span (segment ids) ↔ a plain passage. */
type AlignRow = { from: string; to?: string; en: string };

export type SourceRow = {
  ref: string;
  /** Root Pāli for this span. */
  pali: string;
  /** Bhikkhu Sujato's canonical English for the same span (CC-BY). */
  trad: string;
  /** Our plain-modern retelling. */
  en: string;
};

/**
 * Resolve a span [`from`..`to`] (inclusive) against a segment map, ordering by
 * the canonical Pāli key list so the Pāli and the translation pull the exact
 * same segments. `to` omitted → a single segment. Missing keys in the target
 * map (the translation occasionally merges segments) are skipped, not fatal.
 */
function resolveSpan(
  orderedKeys: string[],
  segments: Record<string, string>,
  row: AlignRow,
): string {
  const start = orderedKeys.indexOf(row.from);
  const end = row.to ? orderedKeys.indexOf(row.to) : start;
  if (start === -1 || end === -1) return "";
  return orderedKeys
    .slice(start, end + 1)
    .map((k) => segments[k]?.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

/** Strip the locale/sutta prefix from a segment id → "1.1" for display. */
function shortRef(id: string): string {
  const colon = id.indexOf(":");
  return colon === -1 ? id : id.slice(colon + 1);
}

type Alignment = Partial<Record<SuttaSlug, AlignRow[]>>;

const EN_ALIGNMENT: Alignment = {
  "first-talk": [
    {
      from: "sn56.11:1.1",
      to: "sn56.11:1.2",
      en: "At Varanasi, in the deer park at Isipatana, he addressed the five monks.",
    },
    {
      from: "sn56.11:2.1",
      to: "sn56.11:2.2",
      en: "If you've left ordinary life behind to find the truth, there are two dead ends you shouldn't waste yourself on.",
    },
    {
      from: "sn56.11:2.3",
      en: "Chasing pleasure — it never satisfies, and it leads nowhere. And punishing yourself — it's painful, pointless, and also gets you nowhere.",
    },
    {
      from: "sn56.11:2.4",
      en: "Steering clear of both of those, I've found a path that runs down the middle. It clears your sight and settles your mind, and it leads to calm, real understanding, and to true freedom.",
    },
    {
      from: "sn56.11:3.1",
      en: "And what is that middle path that clears your sight and settles your mind? It's this — eight things to get right:",
    },
    {
      from: "sn56.11:3.2",
      to: "sn56.11:3.3",
      en: "Seeing clearly, living with intention, speaking honestly, acting decently, earning a living that does no harm, making steady effort, staying mindful, and focusing deeply. (These are often called the Noble Eightfold Path.)",
    },
    {
      from: "sn56.11:3.4",
      en: "That's the middle path I found — the one that clears your sight and settles your mind, and leads to a calm, real understanding, and true freedom.",
    },
    {
      from: "sn56.11:4.1",
      to: "sn56.11:4.2",
      en: "Suffering. Being born is hard. Growing old is hard. Getting sick is hard. Dying is hard. Being stuck with what you can't stand hurts; being torn from what you love hurts; not getting what you want hurts. Grasping at life — that's suffering.",
    },
    {
      from: "sn56.11:4.3",
      to: "sn56.11:4.5",
      en: "Where it comes from. It comes from craving — the restless wanting that keeps pulling you back for more: wanting pleasure, wanting to keep existing, wanting to stop existing.",
    },
    {
      from: "sn56.11:4.6",
      to: "sn56.11:4.7",
      en: "How it ends. It's the complete fading-out of that very craving — finally letting it go, releasing it, holding on to none of it.",
    },
    {
      from: "sn56.11:4.8",
      to: "sn56.11:4.10",
      en: "The way there. It's simply this same eightfold path: seeing clearly, living with intention, speaking honestly, acting decently, earning a living that does no harm, making steady effort, staying mindful, and focusing deeply.",
    },
    {
      from: "sn56.11:5.1",
      to: "sn56.11:5.3",
      en: "For each of these four truths, my understanding deepened in three steps. Take suffering: first I saw clearly, this is suffering; then I understood, this is something to be fully grasped; then I knew, I have fully grasped it.",
    },
    {
      from: "sn56.11:6.1",
      to: "sn56.11:8.3",
      en: "The same three steps applied to all four. Suffering — recognize it, understand it, know it. Its cause — recognize it, let it go, be free of it. Its ending — recognize it, experience it, see it. The path — recognize it, develop it, live it.",
    },
    {
      from: "sn56.11:9.1",
      to: "sn56.11:10.3",
      en: "As long as my understanding of these four truths — in all three steps, across all twelve points — wasn't completely clear, I didn't claim to be fully awakened. But once it was completely clear, then I knew I had woken up fully, with nothing left to do. And the certainty settled in me: my freedom can't be shaken; this is the final birth.",
    },
    {
      from: "sn56.11:10.4",
      to: "sn56.11:10.5",
      en: "That's what the Buddha said, and the five of them were glad to hear it.",
    },
    {
      from: "sn56.11:11.1",
      to: "sn56.11:11.2",
      en: "And while he was speaking, something opened up in one of them, Kondañña — a clear, clean insight cut through: anything that begins is something that ends.",
    },
    {
      from: "sn56.11:12.1",
      to: "sn56.11:12.2",
      en: "And the moment the Buddha set this teaching in motion, the call went up. All of Earth's gods cried out: near Varanasi, in the deer park at Isipatana, the Buddha has set in motion the unsurpassed wheel of truth — and no one anywhere, no seeker or sage, no god, no demon, can stop it from turning.",
    },
    {
      from: "sn56.11:12.3",
      to: "sn56.11:12.11",
      en: "The cry was taken up and passed on, realm after realm, rippling outward and upward, further and further, as if the whole universe had felt it move.",
    },
    {
      from: "sn56.11:13.1",
      to: "sn56.11:13.2",
      en: "So in that moment, in that instant, the cry rose all the way to the highest heavens. The ten-thousandfold universe-system shook and shuddered and trembled, and a vast, boundless light broke out across it — brighter even than the radiance of the gods themselves.",
    },
    {
      from: "sn56.11:14.1",
      to: "sn56.11:14.2",
      en: "Then the Buddha spoke these words: Kondañña has understood! Kondañña has truly understood!",
    },
    {
      from: "sn56.11:14.3",
      en: "And that's how Kondañña came to be called Aññā Kondañña — Kondañña Who Knows.",
    },
  ],
  "loving-kindness": [
    {
      from: "snp1.8:1.1",
      to: "snp1.8:1.2",
      en: "Here's what someone should do if they want to live well and find real peace.",
    },
    {
      from: "snp1.8:1.3",
      to: "snp1.8:1.4",
      en: "Be capable and honest — genuinely, deeply honest. Be open to guidance. Be gentle. Don't carry yourself like you're better than anyone.",
    },
    {
      from: "snp1.8:2.1",
      to: "snp1.8:2.4",
      en: "Live simply, with few wants. Be easy to please and easy to support. Don't take on more than you need to. Stay calm and clear-headed. Don't be pushy, and don't cling to people just for what they can give you.",
    },
    {
      from: "snp1.8:3.1",
      to: "snp1.8:3.2",
      en: "And never do even the smallest thing that thoughtful people would later look at and shake their heads over.",
    },
    {
      from: "snp1.8:3.3",
      to: "snp1.8:3.4",
      en: "Now, hold this wish in your heart: may everyone be at ease, may everyone be safe, may everyone be happy.",
    },
    {
      from: "snp1.8:4.1",
      to: "snp1.8:4.2",
      en: "And mean everyone — no exceptions. Whatever's alive out there: the fragile and the strong, every one of them.",
    },
    {
      from: "snp1.8:4.3",
      to: "snp1.8:4.4",
      en: "The big, the small, the in-between.",
    },
    {
      from: "snp1.8:5.1",
      to: "snp1.8:5.2",
      en: "The ones you can see and the ones you can't. The ones nearby and the ones far away.",
    },
    {
      from: "snp1.8:5.3",
      to: "snp1.8:5.4",
      en: "The ones already here and the ones not yet born. May all of them, without leaving a single one out, be happy.",
    },
    {
      from: "snp1.8:6.1",
      to: "snp1.8:6.4",
      en: "Don't deceive anyone. Don't look down on anyone, anywhere. Don't let anger or resentment make you wish harm on another person.",
    },
    {
      from: "snp1.8:7.1",
      to: "snp1.8:7.4",
      en: "Think of how a mother would protect her only child — willing to put her own life on the line for it. Hold that same care toward every living thing — a heart without limit.",
    },
    {
      from: "snp1.8:8.1",
      to: "snp1.8:8.4",
      en: "Let that goodwill fill the whole world — above you, below you, all around you — with no walls in it, no grudge, no enemy anywhere in it.",
    },
    {
      from: "snp1.8:9.1",
      to: "snp1.8:9.4",
      en: "Whether you're standing, walking, sitting, or lying down — for as long as you're awake — keep this in your heart. This is what they call divine living — right here, in this life.",
    },
    {
      from: "snp1.8:10.1",
      to: "snp1.8:10.4",
      en: "And the one who lives like this — who doesn't get trapped in rigid opinions, who's decent and sees clearly, who's worked through the pull of craving — that person is free, and won't be caught in this whole cycle again.",
    },
  ],
  "not-self": alignNotSelf as AlignRow[],
  "fire-sermon": alignFireSermon as AlignRow[],
  mindfulness: alignMindfulness as AlignRow[],
  "how-to-decide": alignHowToDecide as AlignRow[],
};

const ALIGNMENT: Record<Locale, Alignment> = {
  en: EN_ALIGNMENT,
  zh: {},
};

/** Slugs that have a published parallel view in this locale (for static params). */
export function sourceSlugs(locale: Locale): SuttaSlug[] {
  return Object.keys(ALIGNMENT[locale] ?? {}) as SuttaSlug[];
}

export function hasSourceView(locale: Locale, slug: SuttaSlug): boolean {
  return Boolean(ALIGNMENT[locale]?.[slug]);
}

/** Build the resolved parallel rows (Pāli text + ref + plain prose) for a page. */
export function getSourceView(
  locale: Locale,
  slug: SuttaSlug,
): SourceRow[] | null {
  const rows = ALIGNMENT[locale]?.[slug];
  if (!rows) return null;
  const pali = PALI_SEGMENTS[slug];
  const sujato = SUJATO_SEGMENTS[slug];
  const orderedKeys = Object.keys(pali);
  return rows.map((row) => ({
    ref: shortRef(row.from),
    pali: resolveSpan(orderedKeys, pali, row),
    trad: resolveSpan(orderedKeys, sujato, row),
    en: row.en,
  }));
}
