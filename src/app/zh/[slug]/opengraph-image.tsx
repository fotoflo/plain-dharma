import {
  renderOgCard,
  publicImageDataUrl,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/og-card";
import { SUTTAS, getMeta, isSuttaSlug } from "@/content";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

type Params = { slug: string };

// Statically generate one OG image per sutta slug at build time. Mirrors the
// per-page `generateStaticParams` in `page.tsx`.
export function generateStaticParams() {
  return SUTTAS.map((slug) => ({ slug }));
}

export async function generateImageMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  if (!isSuttaSlug(slug)) return [];
  const meta = getMeta("zh", slug);
  return [
    {
      id: "card",
      alt: `${meta.title} — Plain Dharma`,
      size: OG_SIZE,
      contentType: OG_CONTENT_TYPE,
    },
  ];
}

export default async function OgImage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const fallbackArt = await publicImageDataUrl("/illustrations/first-talk.png");
  if (!isSuttaSlug(slug)) {
    return renderOgCard({
      eyebrow: "Plain Dharma",
      title: "古老的智慧。\n平实的语言。",
      illustrationDataUrl: fallbackArt,
      cjk: true,
    });
  }
  const meta = getMeta("zh", slug);
  const illustrationDataUrl = await publicImageDataUrl(
    `/illustrations/${slug}.png`,
  );
  return renderOgCard({
    eyebrow: meta.kicker_override ?? meta.pali_name,
    title: meta.title,
    illustrationDataUrl,
    cjk: true,
  });
}
