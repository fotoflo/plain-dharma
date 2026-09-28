import {
  renderOgCard,
  publicImageDataUrl,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/og-card";

export const alt = "Alex Miller, editor of Plain Dharma";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OgImage() {
  const illustrationDataUrl = await publicImageDataUrl("/illustrations/how-to-decide.png");
  return renderOgCard({
    eyebrow: "The editor",
    title: "Alex Miller.",
    illustrationDataUrl,
  });
}
