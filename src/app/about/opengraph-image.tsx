import {
  renderOgCard,
  publicImageDataUrl,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/og-card";

export const alt = "About Plain Dharma";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OgImage() {
  const illustrationDataUrl = await publicImageDataUrl("/illustrations/first-talk.png");
  return renderOgCard({
    eyebrow: "About",
    title: "About this version.",
    illustrationDataUrl,
  });
}
