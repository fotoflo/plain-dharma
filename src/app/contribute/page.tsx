import type { Metadata } from "next";
import { getStrings } from "@/content/strings";
import { ContributeView } from "@/views/ContributeView";
import { ogBase } from "@/lib/og-meta";

const s = getStrings("en");
const TITLE = s.contribute.metadataTitle;
const DESCRIPTION = s.contribute.metadataDescription;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/contribute",
    languages: { "zh-Hans": "/zh/contribute" },
  },
  openGraph: {
    ...ogBase("en"),
    title: TITLE,
    description: DESCRIPTION,
    url: "/contribute",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function ContributePage() {
  return <ContributeView locale="en" />;
}
