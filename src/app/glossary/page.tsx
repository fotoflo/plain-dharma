import type { Metadata } from "next";
import { getStrings } from "@/content/strings";
import { GlossaryView } from "@/views/GlossaryView";

const s = getStrings("en");
const TITLE = s.nav.glossary;
const DESCRIPTION = s.glossary.metadataDescription;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/glossary",
    languages: { "zh-Hans": "/zh/glossary" },
  },
  openGraph: {
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
