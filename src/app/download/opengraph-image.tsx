import {
  renderOgCard,
  publicImageDataUrl,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@/lib/og-card";

export const alt = "Plain Dharma — free book: EPUB, PDF, and audiobook";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Shared links to /download (Reddit, social) should read as "a free book" at a
// glance, so this card shows the real cover rather than an illustration.
export default async function OgImage() {
  const coverDataUrl = await publicImageDataUrl("/downloads/plain-dharma-cover.jpg");
  return renderOgCard({
    eyebrow: "Free download",
    title: "The Buddha’s\nfoundational teachings,\nin modern English.",
    titleSize: 58,
    tagline: "EPUB, PDF, and audiobook. Free to read, listen, share, and remix.",
    illustrationDataUrl: coverDataUrl,
    artShape: "cover",
  });
}
