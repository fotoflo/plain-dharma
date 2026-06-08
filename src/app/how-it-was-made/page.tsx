import type { Metadata } from "next";
import { ogBase, altLanguages } from "@/lib/og-meta";
import { HowItWasMadeView } from "@/views/HowItWasMadeView";

const TITLE = "How this was made";
const DESCRIPTION =
  "The story behind Plain Dharma — a 3 a.m. question, a Gen-Z detour that went too far, and then the slow work of arguing every phrase against the Pāli, by hand.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // English-only: the screenshots and manuscript photos are of the English work.
  alternates: altLanguages("/how-it-was-made", { zh: false }),
  openGraph: {
    ...ogBase("en"),
    title: TITLE,
    description: DESCRIPTION,
    url: "/how-it-was-made",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function HowItWasMadePage() {
  return <HowItWasMadeView />;
}
