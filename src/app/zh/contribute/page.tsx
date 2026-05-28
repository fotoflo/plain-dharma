import type { Metadata } from "next";
import { getStrings } from "@/content/strings";
import { ContributeView } from "@/views/ContributeView";

const s = getStrings("zh");
const TITLE = s.contribute.metadataTitle;
const DESCRIPTION = s.contribute.metadataDescription;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/zh/contribute",
    languages: { en: "/contribute" },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/zh/contribute",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function ZhContributePage() {
  return <ContributeView locale="zh" />;
}
