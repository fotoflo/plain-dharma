import type { Metadata } from "next";
import { Suspense } from "react";
import { Wash } from "@/components/Wash";
import { DonateForm } from "./DonateForm";

const TITLE = "Pay what feels right";
const DESCRIPTION =
  "Plain Dharma is free under CC0. If you donate, here's where it goes.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false }, // not a destination page
};

export default function DonatePage() {
  return (
    <div className="relative mx-auto w-full max-w-2xl overflow-hidden px-6 py-16 sm:py-20">
      <Wash size="md" position="top-right" intensity={0.09} />

      <header className="mb-10">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          Pay what feels right
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          Read it. Pay what feels right.
        </h1>
        <p className="mt-6 font-serif text-lg leading-relaxed text-ink/80">
          Plain Dharma is free under{" "}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link underline-offset-4 hover:text-accent hover:underline"
          >
            CC0
          </a>
          . If you do donate, it supports more translations, printed copies,
          and keeping the site online.
        </p>
      </header>

      <Suspense
        fallback={
          <p className="font-serif text-base text-ink/60">Loading…</p>
        }
      >
        <DonateForm />
      </Suspense>
    </div>
  );
}
