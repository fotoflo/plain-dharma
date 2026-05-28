import {
  renderOgCard,
  publicImageDataUrl,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/og-card";

export const alt = "Plain Dharma — read all six teachings";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OgImage() {
  const illustrationDataUrl = await publicImageDataUrl("/illustrations/first-talk.png");
  return renderOgCard({
    eyebrow: "Plain Dharma",
    title: "Old Wisdom.\nPlain English.",
    tagline: "Buddhist foundational teachings.",
    illustrationDataUrl,
  });
}
