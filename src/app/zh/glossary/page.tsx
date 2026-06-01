import type { Metadata } from "next";
import { getStrings } from "@plain-dharma/content/strings";
import { GlossaryView } from "@/views/GlossaryView";
import { ogBase, altLanguages } from "@/lib/og-meta";

const s = getStrings("zh");
const TITLE = s.nav.glossary;
const DESCRIPTION = s.glossary.metadataDescription;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: altLanguages("/glossary", { current: "zh" }),
  openGraph: {
    ...ogBase("zh"),
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
