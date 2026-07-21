// Loader for the segment-aligned canonical text (Pāli root + Bhikkhu Sujato's
// English) pulled from SuttaCentral by `scripts/fetch-canonical.ts` and committed
// under `packages/content/canonical/`. Both sources are CC0 (Mahāsaṅgīti Pāli +
// Bhikkhu Sujato). Used by the `/[slug]/compare` side-by-side reading view.
//
// English-only: SuttaCentral gives us a Pāli↔English alignment, which we set
// beside our own plain-English translation. There is no equivalent alignment for
// the zh surface, so `getCanonical` is only wired up for `en`.
import type { SuttaSlug } from "@plain-dharma/content";

import firstTalk from "@plain-dharma/content/canonical/first-talk.json";
import notSelf from "@plain-dharma/content/canonical/not-self.json";
import fireSermon from "@plain-dharma/content/canonical/fire-sermon.json";
import lovingKindness from "@plain-dharma/content/canonical/loving-kindness.json";
import mindfulness from "@plain-dharma/content/canonical/mindfulness.json";
import howToDecide from "@plain-dharma/content/canonical/how-to-decide.json";

type CanonicalDoc = {
  uid: string;
  paliAuthor: string;
  translationAuthor: string;
  translationAuthorUid: string;
  source: string;
  order: string[];
  pali: Record<string, string>;
  translation: Record<string, string>;
};

const DOCS: Record<SuttaSlug, CanonicalDoc> = {
  "first-talk": firstTalk,
  "not-self": notSelf,
  "fire-sermon": fireSermon,
  "loving-kindness": lovingKindness,
  mindfulness: mindfulness,
  "how-to-decide": howToDecide,
};

/** One paragraph-level row of the side-by-side, with Pāli + English aligned. */
export type CanonicalParagraph = {
  /** Grouping key (the major segment number, e.g. "1", "2"). */
  id: string;
  /** Pāli root text for the paragraph. */
  pali: string;
  /** Bhikkhu Sujato's English for the paragraph. */
  en: string;
};

export type Canonical = {
  uid: string;
  paliAuthor: string;
  translationAuthor: string;
  source: string;
  /** Title/header segments (group "0"), already joined. */
  title: { pali: string; en: string };
  /** Body paragraphs in document order. */
  paragraphs: CanonicalParagraph[];
};

// Segment ids look like "sn56.11:1.2" — the part after ":" is "<para>.<sentence>".
// We group sentences that share a <para> number into one paragraph row so the
// table reads in natural blocks rather than one row per clause.
function paragraphKey(segmentId: string): string {
  const local = segmentId.split(":")[1] ?? segmentId;
  return local.split(".")[0];
}

export function getCanonical(slug: SuttaSlug): Canonical {
  const doc = DOCS[slug];
  const groups = new Map<string, { pali: string[]; en: string[] }>();

  for (const id of doc.order) {
    const key = paragraphKey(id);
    const group = groups.get(key) ?? { pali: [], en: [] };
    const pali = (doc.pali[id] ?? "").trim();
    const en = (doc.translation[id] ?? "").trim();
    if (pali) group.pali.push(pali);
    if (en) group.en.push(en);
    groups.set(key, group);
  }

  const join = (key: string) => {
    const g = groups.get(key);
    return {
      pali: g ? g.pali.join(" ") : "",
      en: g ? g.en.join(" ") : "",
    };
  };

  const title = join("0");
  const paragraphs: CanonicalParagraph[] = [];
  for (const key of groups.keys()) {
    if (key === "0") continue;
    const { pali, en } = join(key);
    if (!pali && !en) continue;
    paragraphs.push({ id: key, pali, en });
  }

  return {
    uid: doc.uid,
    paliAuthor: doc.paliAuthor,
    translationAuthor: doc.translationAuthor,
    source: doc.source,
    title,
    paragraphs,
  };
}
