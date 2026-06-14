import type { Metadata } from "next";
import { PrivateView } from "@/views/PrivateView";

// Operator-only fill-sheet behind a server-checked PIN. Keep it out of search
// and the sitemap; the content is fetched from /api/private only on a valid PIN.
export const metadata: Metadata = {
  title: "Private",
  robots: { index: false, follow: false },
};

export default function PrivatePage() {
  return <PrivateView />;
}
