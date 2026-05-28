import Link from "next/link";
import type { Metadata } from "next";
import { Wash } from "@/components/Wash";
import { ogBase } from "@/lib/og-meta";

const TITLE = "Download";
const DESCRIPTION =
  "PDF and EPUB downloads of all six teachings, free under CC0. Pay what feels right.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/download" },
  openGraph: {
    ...ogBase("en"),
    title: TITLE,
    description: DESCRIPTION,
    url: "/download",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

type FileOption = {
  slug: "epub" | "pdf" | "m4b";
  title: string;
  description: string;
  size: string;
  href: string;
};

const FILES: FileOption[] = [
  {
    slug: "epub",
    title: "EPUB",
    description: "For Kindle, Apple Books, Kobo, and other e-readers.",
    size: "451 KB",
    href: "/downloads/plain-dharma.epub",
  },
  {
    slug: "pdf",
    title: "PDF",
    description: "For tablet or laptop reading, 6×9 typeset.",
    size: "725 KB",
    href: "/downloads/plain-dharma.pdf",
  },
  {
    slug: "m4b",
    title: "Audiobook",
    description:
      "Narrated edition with chapter markers. ~38 minutes. M4B opens in Apple Books, VLC, or any audiobook player.",
    size: "18 MB",
    href: "/downloads/plain-dharma.m4b",
  },
];

export default function DownloadPage() {
  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden px-6 py-16 sm:py-20">
      <Wash size="md" position="top-right" intensity={0.09} />

      <header className="mb-12">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          Download
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          Download the book
        </h1>
        <p className="mt-6 font-serif text-lg leading-relaxed text-ink/80">
          Free under CC0. Pay what feels right — including nothing.
        </p>
      </header>

      <div className="space-y-6">
        {FILES.map((file) => (
          <FileCard key={file.slug} file={file} />
        ))}
      </div>

      <article className="prose-dharma mt-16">
        <h2>About the files</h2>
        <p>
          Everything is{" "}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC0 1.0 / public domain
          </a>
          . Copy, print, translate, distribute, modify — no permission needed,
          no attribution required.
        </p>
        <p>
          The source markdown lives on{" "}
          <a
            href="https://github.com/fotoflo/plain-dharma"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          . If you want to print booklets for free distribution at a temple or
          retreat, copy whatever you need.
        </p>

        <h2>Coming soon</h2>
        <ul>
          <li>
            <strong>Print-ready PDF</strong> — 5×8 trim with bleed, gutter, and
            embedded fonts for KDP Print or a local printer.
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

function FileCard({ file }: { file: FileOption }) {
  return (
    <div className="rounded-lg border border-divider/80 p-6">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="font-serif text-2xl text-ink">{file.title}</h2>
        <span className="font-sans text-xs uppercase tracking-wider text-ink/55">
          {file.size}
        </span>
      </div>
      <p className="mt-2 font-serif text-base text-ink/80">
        {file.description}
      </p>
      <div className="mt-5">
        <Link
          href={`/download/donate?file=${file.slug}`}
          className="inline-flex items-center rounded-full bg-accent-strong px-6 py-2.5 font-sans text-sm font-medium text-white no-underline shadow-sm transition hover:no-underline hover:opacity-90"
        >
          Download
        </Link>
      </div>
    </div>
  );
}
