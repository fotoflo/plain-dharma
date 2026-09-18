import type { Metadata } from "next";
import { PrintView } from "@/views/PrintView";
import { PAGE } from "@/content/print-strings";
import { ogBase, altLanguages } from "@/lib/og-meta";

const s = PAGE.en;

export const metadata: Metadata = {
  title: s.metadataTitle,
  description: s.metadataDescription,
  alternates: altLanguages("/print", { th: true }),
  openGraph: {
    ...ogBase("en"),
    title: s.metadataTitle,
    description: s.metadataDescription,
    url: "/print",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: s.metadataTitle,
    description: s.metadataDescription,
  },
};

export default function PrintPage() {
  return <PrintView lang="en" />;
}
