import type { Metadata } from "next";
import { Suspense } from "react";
import { Wash } from "@/components/Wash";
import { Return } from "./Return";

const TITLE = "Returning to the app";

export const metadata: Metadata = {
  title: TITLE,
  robots: { index: false, follow: false }, // transient handoff page
};

// Stripe's success/cancel redirects must be https, so the mobile app can't be
// the redirect target directly. The native donate flow points Stripe here; this
// page immediately bounces into the app's `mobile://` deep link, which the
// in-app browser's auth session intercepts to hand control back to the app.
export default function ReturnPage() {
  return (
    <div className="relative mx-auto w-full max-w-2xl overflow-hidden px-6 py-24 text-center">
      <Wash size="md" position="top-center" intensity={0.09} />
      <Suspense
        fallback={
          <p className="font-serif text-base text-ink/60">Loading…</p>
        }
      >
        <Return />
      </Suspense>
    </div>
  );
}
