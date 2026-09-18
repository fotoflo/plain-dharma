import type { Metadata } from "next";
import { RepublishChecklistView } from "@/views/RepublishChecklistView";

// Operator-only ISBN/byline cleanup checklist. Unlisted like /private: noindex,
// robots-disallowed (the /private prefix rule covers it), not in the sitemap.
export const metadata: Metadata = {
  title: "Checklist",
  robots: { index: false, follow: false },
};

export default function ChecklistPage() {
  return <RepublishChecklistView />;
}
