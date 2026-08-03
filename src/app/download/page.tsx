import Link from "next/link";
import type { Metadata } from "next";
import { assetUrl, assetDownloadUrl } from "@plain-dharma/content/assets";
import { Wash } from "@/components/Wash";
import { ogBase, altLanguages } from "@/lib/og-meta";
import { APP_LINKS, APP_PUBLISHED } from "@/lib/app-links";
import { BOOK_LINKS } from "@/lib/book-links";
import { StoreBadges } from "@/components/StoreBadges";

const TITLE = "Download";
const DESCRIPTION =
  "PDF and audiobook downloads of all six teachings, free for anyone to keep, copy, and share — or get the paperback on Amazon. Pay what feels right.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: altLanguages("/download", { zh: false }),
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
  slug: "pdf" | "m4b";
  title: string;
  description: string;
  size: string;
  href: string;
  // Optional second CTA: a print-friendly black-and-white variant, downloaded
  // directly (no donation nudge — it's for free print distribution).
  bwHref?: string;
};

const FILES: FileOption[] = [
  {
    slug: "pdf",
    title: "PDF",
    description:
      "For tablet or laptop reading, or printing. 6×9 typeset — color, with a black-and-white version for plain printers.",
    size: "725 KB",
    href: assetUrl("downloads/plain-dharma.pdf"),
    bwHref: assetDownloadUrl("downloads/plain-dharma-print-bw.pdf"),
  },
  {
    slug: "m4b",
    title: "Audiobook",
    description:
      "Narrated edition with chapter markers. ~38 minutes. M4B opens in Apple Books, VLC, or any audiobook player.",
    size: "18 MB",
    href: assetUrl("downloads/plain-dharma.m4b"),
  },
];

export default function DownloadPage() {
  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden px-6 py-16 sm:py-20">
      <Wash size="md" position="top-right" intensity={0.09} />

      <header className="mb-12 flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-10">
        {/* Transparent cut-out that floats on both themes; CSS adds the shadow. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetUrl("downloads/plain-dharma-book-photo.png")}
          alt="Plain Dharma — the printed book"
          width={440}
          height={777}
          className="w-[180px] shrink-0 [filter:drop-shadow(0_14px_22px_rgba(31,24,18,0.26))] sm:w-[200px]"
        />
        <div>
          <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
            Download
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
            Download the book
          </h1>
          <p className="mt-6 font-serif text-lg leading-relaxed text-ink/80">
            Free and public domain — yours to keep, copy, and share. Pay what
            feels right, including nothing.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        {FILES.map((file) => (
          <FileCard key={file.slug} file={file} />
        ))}
        <PaperbackCard />
      </div>

      {BOOK_LINKS.amazonKindle ? (
        <p className="mt-8 text-center font-serif text-base text-ink/70">
          Prefer Kindle? The ebook edition is{" "}
          <a
            href={BOOK_LINKS.amazonKindle}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:text-accent"
          >
            available on Amazon
          </a>
          . Everything here is free — we don&rsquo;t sell it; Amazon sets its own
          price.
        </p>
      ) : null}

      {APP_PUBLISHED && <AppBadges />}

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
        <p>
          Want the raw materials instead of the finished book — the audio track
          by track, the illustrations, the plain-text source? Take them all on
          the <Link href="/remix">remix &amp; reuse page</Link>. DJs, artists,
          and translators welcome.
        </p>

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

/**
 * The paperback, sold on Amazon. Sits alongside the free file cards — same
 * chrome, but the CTA is an external buy link (Amazon sets the price; nothing
 * on this page stops being free).
 */
function PaperbackCard() {
  return (
    <div className="rounded-lg border border-divider/80 p-6">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="font-serif text-2xl text-ink">Paperback</h2>
        <span className="font-sans text-xs uppercase tracking-wider text-ink/55">
          6×9 print edition
        </span>
      </div>
      <p className="mt-2 font-serif text-base text-ink/80">
        The printed book — all six teachings in the same typeset as the PDF,
        sold on Amazon. Amazon sets its price; everything on this page stays
        free.
      </p>
      <div className="mt-5">
        <a
          href={BOOK_LINKS.amazonPaperback}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-accent-strong px-6 py-2.5 font-sans text-sm font-medium text-accent-strong no-underline transition hover:bg-accent-strong/5 hover:no-underline"
        >
          Buy on Amazon
        </a>
      </div>
    </div>
  );
}

/**
 * "Get the app" panel. Hidden until a store listing is live (`APP_PUBLISHED`;
 * StoreBadges renders only the live stores' badges, so gate the chrome too).
 */
function AppBadges() {
  return (
    <section className="mt-12 rounded-lg border border-divider/80 p-6 text-center">
      <h2 className="font-serif text-2xl text-ink">Get the app</h2>
      <p className="mt-2 font-serif text-base text-ink/80">
        {APP_LINKS.androidPublished
          ? "Read and listen offline on iPhone and Android."
          : "Read and listen offline on your iPhone. Android is on the way."}
      </p>
      <StoreBadges className="mt-5" />
    </section>
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
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={`/download/donate?file=${file.slug}&ref=download`}
          className="inline-flex items-center rounded-full bg-accent-strong px-6 py-2.5 font-sans text-sm font-medium text-white no-underline shadow-sm transition hover:no-underline hover:opacity-90"
        >
          Free Download
        </Link>
        {file.bwHref && (
          <a
            href={file.bwHref}
            download
            className="inline-flex items-center rounded-full border border-accent-strong px-6 py-2.5 font-sans text-sm font-medium text-accent-strong no-underline transition hover:bg-accent-strong/5 hover:no-underline"
          >
            B&amp;W for printing
          </a>
        )}
      </div>
    </div>
  );
}
