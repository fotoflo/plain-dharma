import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  SUTTAS,
  type SuttaSlug,
  isSuttaSlug,
  getMeta,
} from "@/content";
import { SuttaView } from "@/views/SuttaView";

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
    alternates: {
      canonical: url,
      languages: { en: `/${slug}` },
    },
    openGraph: {
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
  return <SuttaView locale="zh" slug={slug as SuttaSlug} />;
}
