import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download",
  description:
    "PDF and ePub downloads of all six teachings, free under CC0.",
};

export default function DownloadPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
      <header className="mb-12">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          Download
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          Download the book
        </h1>
      </header>

      <article className="prose-dharma">
        <p>
          PDF, ePub, and print-ready files are <em>coming soon.</em>
        </p>
        <p>
          In the meantime, every word on this site is freely available to
          read, copy, print, translate, and distribute. The text is released
          under{" "}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC0 1.0 / public domain
          </a>{" "}
          — no permission needed, no attribution required.
        </p>
        <p>
          The full source markdown is on{" "}
          <a
            href="https://github.com/fotoflo/plain-dharma"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          . If you want to print booklets for free distribution at a temple
          or retreat, copy whatever you need.
        </p>

        <h2>What&apos;s planned</h2>
        <ul>
          <li>
            <strong>Screen PDF</strong> — for reading on a tablet or laptop.
          </li>
          <li>
            <strong>ePub</strong> — for Kindle, Apple Books, and other
            e-readers.
          </li>
          <li>
            <strong>Print-ready PDF</strong> — saddle-stitched booklet,
            roughly 5×8 inches, with trim marks. Drop it on any print shop.
          </li>
        </ul>
      </article>

      <div className="mt-16 text-center">
        <Link
          href="/read"
          className="font-sans text-sm text-link hover:text-accent"
        >
          Read on the web →
        </Link>
      </div>
    </div>
  );
}
