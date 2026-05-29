import type { Metadata } from "next";
import { getStrings } from "@plain-dharma/content/strings";
import { ReadView } from "@/views/ReadView";
import { ogBase } from "@/lib/og-meta";

const s = getStrings("zh");
const TITLE = s.read.metadataTitle;
const DESCRIPTION = s.read.metadataDescription;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/read",
    languages: { en: "/read" },
  },
  openGraph: {
    ...ogBase("zh"),
    title: TITLE,
    description: DESCRIPTION,
    url: "/zh/read",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function ZhReadPage() {
  return <ReadView locale="zh" />;
}
