import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SUTTAS, isSuttaSlug, getMeta } from "@/content";
import { SuttaView } from "@/views/SuttaView";
import { ogBase, altLanguages } from "@/lib/og-meta";
import { JsonLd } from "@/components/JsonLd";
import { suttaPageJsonLd } from "@/lib/structured-data";

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
  const meta = getMeta("zh", slug);
  const url = `/zh/${slug}`;
  return {
    title: meta.title,
    description: meta.subtitle,
    alternates: altLanguages(`/${slug}`, { current: "zh" }),
    openGraph: {
      ...ogBase("zh"),
      type: "article",
      url,
      title: meta.title,
      description: meta.subtitle,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.subtitle,
    },
  };
}

export default async function ZhSuttaPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  if (!isSuttaSlug(slug)) notFound();
  return (
    <>
      <JsonLd data={suttaPageJsonLd("zh", slug)} />
      <SuttaView locale="zh" slug={slug} />
    </>
  );
}
