import type { Metadata } from "next";
import { ogBase, altLanguages } from "@/lib/og-meta";
import { QuotesView } from "@/views/QuotesView";

const TITLE = "Real Buddha Quotes in Plain English, with Sources";
const DESCRIPTION =
  "Real Buddha quotes on suffering, letting go, kindness, mindfulness and doubt, word for word from the early suttas, each with its Pāli Canon reference (SN 56.11, MN 10, AN 3.65…) and a free image to share.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // English-only: the graphics are English.
  alternates: altLanguages("/quotes", { zh: false }),
  openGraph: { ...ogBase("en"), title: TITLE, description: DESCRIPTION, url: "/quotes" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function QuotesPage() {
  return <QuotesView />;
}
