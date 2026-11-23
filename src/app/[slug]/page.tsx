import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SUTTAS, isSuttaSlug, type SuttaSlug } from "@/content";
import { SuttaView } from "@/views/SuttaView";
import { ogBase, altLanguages } from "@/lib/og-meta";
import { JsonLd } from "@/components/JsonLd";
import { suttaPageJsonLd } from "@/lib/structured-data";

export function generateStaticParams() {
  return SUTTAS.map((slug) => ({ slug }));
}

export const dynamicParams = false;

type Params = { slug: string };

/**
 * Search titles and descriptions, kept apart from the on-page titles in
 * SUTTA_DISPLAY (shared with the app). People search these teachings by their
 * traditional names ("fire sermon", "metta sutta", "kalama sutta"), which the
 * reading titles ("The Buddha's Third Talk") don't carry.
 */
const SEO: Record<SuttaSlug, { title: string; description: string }> = {
  "first-talk": {
    title: "The Buddha's First Sermon (Dhammacakkappavattana Sutta)",
    description:
      "The Buddha's first sermon in plain modern English: the Middle Way, the Four Noble Truths and the Eightfold Path, as told to five old companions. Free to read and hear.",
  },
  "not-self": {
    title: "The Not-Self Sutta (Anattalakkhaṇa Sutta) in Plain English",
    description:
      "The Buddha's second talk in plain modern English: why your body and mind are not really you. The discourse on not-self, free to read and hear.",
  },
  "fire-sermon": {
    title: "The Fire Sermon (Ādittapariyāya Sutta) in Plain English",
    description:
      "The Buddha's Fire Sermon in plain modern English: everything is burning, with wanting, anger and confusion, and how to let go. Free to read and hear.",
  },
  "loving-kindness": {
    title: "Loving-Kindness in Plain English: The Mettā Sutta",
    description:
      "The Mettā Sutta, the Buddha's teaching on loving-kindness, in plain modern English. Short, almost a poem. Read online free, or download the PDF and audio.",
  },
  mindfulness: {
    title: "The Foundations of Mindfulness (Satipaṭṭhāna Sutta)",
    description:
      "The Satipaṭṭhāna Sutta in plain modern English: the Buddha's step-by-step guide to mindfulness of body, feelings, mind and experience. Free to read and hear.",
  },
  "how-to-decide": {
    title: "The Kālāma Sutta: How to Decide What to Believe",
    description:
      "The Kālāma Sutta in plain modern English: the Buddha's advice on thinking for yourself and testing what you're told. Free to read and hear.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isSuttaSlug(slug)) return {};
  const meta = SEO[slug];
  const url = `/${slug}`;
  return {
    title: meta.title,
    description: meta.description,
    alternates: altLanguages(url),
    openGraph: {
      ...ogBase("en"),
      type: "article",
      url,
      title: meta.title,
      description: meta.description,
      // Image supplied by src/app/[slug]/opengraph-image.tsx — generated
      // per-slug at build time with the Plain Dharma card template.
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function SuttaPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  if (!isSuttaSlug(slug)) notFound();
  return (
    <>
      <JsonLd data={suttaPageJsonLd("en", slug)} />
      <SuttaView locale="en" slug={slug} />
    </>
  );
}
