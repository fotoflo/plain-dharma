import type { Metadata } from "next";
import { PrintView } from "@/views/PrintView";
import { PAGE } from "@/content/print-strings";
import { SITE_NAME, altLanguages } from "@/lib/og-meta";

const s = PAGE.th;

// ogBase() is typed to the site's locales; Thai isn't one, so the two OG fields
// are set inline here rather than widening that helper for a single page.
export const metadata: Metadata = {
  title: s.metadataTitle,
  description: s.metadataDescription,
  alternates: altLanguages("/print", { th: true, current: "th" }),
  openGraph: {
    siteName: SITE_NAME,
    locale: "th_TH",
    title: s.metadataTitle,
    description: s.metadataDescription,
    url: "/th/print",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: s.metadataTitle,
    description: s.metadataDescription,
  },
};

export default function ThPrintPage() {
  return <PrintView lang="th" />;
}
