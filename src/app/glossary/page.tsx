import type { Metadata } from "next";
import { getStrings } from "@plain-dharma/content/strings";
import { GlossaryView } from "@/views/GlossaryView";
import { ogBase, altLanguages } from "@/lib/og-meta";

const s = getStrings("en");
const TITLE = s.nav.glossary;
const DESCRIPTION = s.glossary.metadataDescription;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: altLanguages("/glossary"),
  openGraph: {
    ...ogBase("en"),
    title: TITLE,
    description: DESCRIPTION,
    url: "/glossary",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function GlossaryPage() {
  return <GlossaryView locale="en" />;
}
