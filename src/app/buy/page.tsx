import type { Metadata } from "next";
import { ogBase, altLanguages } from "@/lib/og-meta";
import { BuyView } from "@/views/BuyView";

const TITLE = "Buy the paperback";
const DESCRIPTION =
  "Plain Dharma as a small paperback, a Kindle edition, or an Audible audiobook — six of the Buddha's foundational teachings in modern English. Every format is also free on this site.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // English-only: the Amazon editions are the English book.
  alternates: altLanguages("/buy", { zh: false }),
  openGraph: {
    ...ogBase("en"),
    title: TITLE,
    description: DESCRIPTION,
    url: "/buy",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function BuyPage() {
  return <BuyView />;
}
