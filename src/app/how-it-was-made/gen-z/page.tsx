import type { Metadata } from "next";
import { ogBase, altLanguages } from "@/lib/og-meta";
import { GenZEditionView } from "@/views/GenZEditionView";

const TITLE = "The Buddha's First Talk — Gen-Z Edition";
const DESCRIPTION =
  "The throwaway draft from the first night: the Buddha's first teaching, all the way in Gen-Z. The register experiment that calibrated the real voice by going too far. Not the book.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: altLanguages("/how-it-was-made/gen-z", { zh: false }),
  // A novelty, not canonical scripture — keep it out of the index so it isn't
  // mistaken for the real rendering. Still reachable via the in-page link.
  robots: { index: false, follow: true },
  openGraph: {
    ...ogBase("en"),
    title: TITLE,
    description: DESCRIPTION,
    url: "/how-it-was-made/gen-z",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function GenZEditionPage() {
  return <GenZEditionView />;
}
