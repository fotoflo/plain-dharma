import type { Metadata } from "next";
import { Suspense } from "react";
import { Wash } from "@/components/Wash";
import { AutoDownload } from "./AutoDownload";

const TITLE = "Thank you";

export const metadata: Metadata = {
  title: TITLE,
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <div className="relative mx-auto w-full max-w-2xl overflow-hidden px-6 py-16 sm:py-20">
      <Wash size="md" position="top-center" intensity={0.09} />

      <header className="mb-10 text-center">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          Thank you
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          Thank you.
        </h1>
        <p className="mt-6 font-serif text-lg leading-relaxed text-ink/80">
          Your donation supports more translations, printed copies for free
          distribution, and keeping the site online.
        </p>
      </header>

      <Suspense
        fallback={
          <p className="text-center font-serif text-base text-ink/60">
            Loading…
          </p>
        }
      >
        <AutoDownload />
      </Suspense>
    </div>
  );
}
