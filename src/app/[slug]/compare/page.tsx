import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SUTTAS, isSuttaSlug, getMeta } from "@/content";
import { CompareView } from "@/views/CompareView";

export function generateStaticParams() {
  return SUTTAS.map((slug) => ({ slug }));
}

export const dynamicParams = false;

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isSuttaSlug(slug)) return {};
  const meta = getMeta("en", slug);
  const title = `${meta.title} — side by side`;
  const description = `Read our plain-English ${meta.title} beside Bhikkhu Sujato’s canonical translation and the Pāli root.`;
  return {
    title,
    description,
    // Comparison pages are reference views — keep them out of the index.
    robots: { index: false, follow: true },
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  if (!isSuttaSlug(slug)) notFound();
  return <CompareView slug={slug} />;
}
