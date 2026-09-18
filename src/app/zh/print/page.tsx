import type { Metadata } from "next";
import { PrintView } from "@/views/PrintView";
import { PAGE } from "@/content/print-strings";
import { ogBase, altLanguages } from "@/lib/og-meta";

const s = PAGE.zh;

export const metadata: Metadata = {
  title: s.metadataTitle,
  description: s.metadataDescription,
  alternates: altLanguages("/print", { th: true, current: "zh" }),
  openGraph: {
    ...ogBase("zh"),
    title: s.metadataTitle,
    description: s.metadataDescription,
    url: "/zh/print",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: s.metadataTitle,
    description: s.metadataDescription,
  },
};

export default function ZhPrintPage() {
  return <PrintView lang="zh" />;
}
