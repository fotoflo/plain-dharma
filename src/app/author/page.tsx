import type { Metadata } from "next";
import { ogBase, altLanguages } from "@/lib/og-meta";
import { JsonLd } from "@/components/JsonLd";
import { graph, personJsonLd } from "@/lib/structured-data";
import { AuthorView } from "@/views/AuthorView";

const TITLE = "Alex Miller, editor";
const DESCRIPTION =
  "Alex Miller edited Plain Dharma line by line against the Pāli — East Asian Studies at Oberlin, Classical Chinese at Peking University, translation at Harper's Magazine.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // English-only, like /how-it-was-made.
  alternates: altLanguages("/author", { zh: false }),
  openGraph: {
    ...ogBase("en"),
    title: TITLE,
    description: DESCRIPTION,
    url: "/author",
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function AuthorPage() {
  return (
    <>
      <JsonLd data={graph([personJsonLd()])} />
      <AuthorView />
    </>
  );
}
