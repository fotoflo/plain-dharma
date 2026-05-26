import Link from "next/link";
import type { Metadata } from "next";
import { Wash } from "@/components/Wash";

export const metadata: Metadata = {
  title: "About this version",
  description:
    "What Plain Dharma is, who it’s for, and where the original teachings come from.",
};

export default function AboutPage() {
  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden px-6 py-16 sm:py-20">
      <Wash size="md" position="top-right" intensity={0.09} />

      <header className="mb-12">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          About
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          About this version
        </h1>
      </header>

      <article className="prose-dharma">
        <p>
          These six teachings are rendered here in plain modern English &mdash;
          not as a scholarly translation, but as a plain reading of what the
          Buddha actually said. The goal is to make the foundational teachings
          accessible to a first-time reader without sacrificing the substance.
        </p>

        <p>
          This is not a substitute for canonical translation. If you find a
          teaching here that moves you, the next step is to read the same
          passage as translated by Bhikkhu Bodhi, Thanissaro Bhikkhu, or the
          collaborative team at SuttaCentral &mdash; three rigorous sources,
          all freely available.
        </p>

        <p>
          What&rsquo;s preserved: the structure, the repetitions, the key
          images, and the moments where the original itself does something
          striking &mdash; like the cosmic ending of the first talk, or the
          mother-and-only-child image in the Mettā Sutta. What&rsquo;s
          stripped: archaic English (&ldquo;thus have I heard&rdquo;),
          unfamiliar terminology where a modern word does the same job, and
          the formal cadences that can put a contemporary reader to sleep.
        </p>

        <h2>Why six?</h2>
        <p>
          These six are the foundation. Every later teaching, every
          commentary, every Buddhist tradition &mdash; they all build on
          these. If you&rsquo;ve read them, you&rsquo;ve read what was there
          at the start.
        </p>

        <p>
          The choice of six (and not ten or twenty) is deliberate: enough to
          understand the whole shape of the teaching without overwhelming
          someone new to it. The full site reads in about 45 minutes.
        </p>

        <h2>License</h2>
        <p>
          Everything on this site is dedicated to the public domain under{" "}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC0
          </a>
          . Copy it, print it, translate it, distribute it, modify it. No
          permission needed; no attribution required.
        </p>

        <p>
          This is in keeping with the Buddhist tradition of the{" "}
          <em>dharma gift</em> &mdash; the practice of freely sharing
          teachings without expectation of return.
        </p>

        <h2>Going deeper</h2>
        <p>For the original Pali texts and scholarly translations:</p>

        <ul>
          <li>
            <a
              href="https://suttacentral.net"
              target="_blank"
              rel="noopener noreferrer"
            >
              SuttaCentral
            </a>{" "}
            &mdash; modern collaborative translations and parallels across
            traditions, freely accessible.
          </li>
          <li>
            <a
              href="https://accesstoinsight.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Access to Insight
            </a>{" "}
            &mdash; Thanissaro Bhikkhu&rsquo;s free translations, with
            extensive notes and commentary.
          </li>
          <li>
            <em>In the Buddha&rsquo;s Words</em> and the four Nikāya volumes
            by Bhikkhu Bodhi (Wisdom Publications) &mdash; the most highly
            regarded modern translations, available in print.
          </li>
        </ul>

        <p>
          For terminology, see the{" "}
          <Link href="/glossary">Glossary</Link>.
        </p>
      </article>

      <div className="mt-16 text-center">
        <Link
          href="/read"
          className="font-sans text-sm text-link hover:text-accent"
        >
          Start reading &rarr;
        </Link>
      </div>
    </div>
  );
}
