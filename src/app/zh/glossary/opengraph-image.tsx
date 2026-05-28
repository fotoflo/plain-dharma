import {
  renderOgCard,
  publicImageDataUrl,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/og-card";

export const alt = "词汇表 — Plain Dharma";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OgImage() {
  const illustrationDataUrl = await publicImageDataUrl("/illustrations/first-talk.png");
  return renderOgCard({
    eyebrow: "词汇表",
    title: "重要词语，\n说得明白。",
    illustrationDataUrl,
    cjk: true,
  });
}
