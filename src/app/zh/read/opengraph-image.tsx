import {
  renderOgCard,
  publicImageDataUrl,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/og-card";

export const alt = "Plain Dharma — 六篇开示一起读";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OgImage() {
  const illustrationDataUrl = await publicImageDataUrl("/illustrations/first-talk.png");
  return renderOgCard({
    eyebrow: "Plain Dharma",
    title: "古老的智慧。\n平实的语言。",
    illustrationDataUrl,
    cjk: true,
  });
}
