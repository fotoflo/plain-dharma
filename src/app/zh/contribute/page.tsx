import type { Metadata } from "next";
import { getStrings } from "@plain-dharma/content/strings";
import { ContributeView } from "@/views/ContributeView";
import { ogBase, altLanguages } from "@/lib/og-meta";

const s = getStrings("zh");
const TITLE = s.contribute.metadataTitle;
const DESCRIPTION = s.contribute.metadataDescription;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: altLanguages("/contribute", { current: "zh" }),
  openGraph: {
    ...ogBase("zh"),
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
