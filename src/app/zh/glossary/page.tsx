import type { Metadata } from "next";
import { getStrings } from "@/content/strings";
import { GlossaryView } from "@/views/GlossaryView";

const s = getStrings("zh");
const TITLE = s.nav.glossary;
const DESCRIPTION = s.glossary.metadataDescription;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/glossary",
    languages: { en: "/glossary" },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/zh/glossary",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function ZhGlossaryPage() {
  return <GlossaryView locale="zh" />;
}
