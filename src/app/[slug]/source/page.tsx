import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isSuttaSlug, getMeta, getNeighbors } from "@/content";
import {
  PALI_SOURCE,
  PALI_LICENSE,
  SUJATO_LICENSE,
  getSourceView,
  hasSourceView,
  sourceSlugs,
  suttaCentralUrl,
} from "@plain-dharma/content/source";
import { ogBase, altLanguages, SITE_NAME, SITE_URL } from "@/lib/og-meta";
import { JsonLd } from "@/components/JsonLd";
import { graph, breadcrumbJsonLd } from "@/lib/structured-data";
import { SourceDiff } from "@/components/SourceDiff";

// Only suttas with a published alignment exist as static pages; everything
// else 404s at build time (no server fallback).
export function generateStaticParams() {
  return sourceSlugs("en").map((slug) => ({ slug }));
}

export const dynamicParams = false;

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isSuttaSlug(slug) || !hasSourceView("en", slug)) return {};
  const { name, ref } = PALI_SOURCE[slug];
  const title = `${name} — Pāli & Plain English`;
  const description = `The ${name} (${ref}) in the original Pāli, laid out line by line beside a plain modern English retelling. Free, CC0.`;
  const url = `/${slug}/source`;
  return {
    title,
    description,
    // The plain-English reading page is the primary destination; this is a
    // companion. Canonical to itself so it can rank for the Pāli-name query,
    // but only en is published, so don't advertise a zh alternate yet.
    alternates: altLanguages(url, { zh: false }),
    openGraph: {
      ...ogBase("en"),
      type: "article",
      url,
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SuttaSourcePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  if (!isSuttaSlug(slug)) notFound();
  const rows = getSourceView("en", slug);
  if (!rows) notFound();

  const meta = getMeta("en", slug);
  const { name, ref } = PALI_SOURCE[slug];
  const scUrl = suttaCentralUrl(slug);

  // Sequential nav across the source pages, in canonical sutta order — only to
  // neighbours that actually have a published parallel view.
  const { prev, next } = getNeighbors("en", slug);
  const prevSource = prev && hasSourceView("en", prev.slug) ? prev : null;
  const nextSource = next && hasSourceView("en", next.slug) ? next : null;

  const jsonLd = graph([
    breadcrumbJsonLd([
      { name: SITE_NAME, url: `${SITE_URL}/` },
      { name: meta.title, url: `${SITE_URL}/${slug}` },
      { name: "Pāli & Plain English", url: `${SITE_URL}/${slug}/source` },
    ]),
  ]);

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
        <header className="mb-10">
          <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
            {ref} · {name}
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
            {meta.title}: the original, side by side
          </h1>
          <p className="mt-4 font-serif text-lg italic leading-relaxed text-ink/70">
            The original Pāli, a careful canonical translation, and our plain
            modern retelling — aligned passage by passage, so you can see
            exactly what the original says and how we render it.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-sans text-sm">
            <Link href={`/${slug}`} className="text-link hover:text-accent">
              ← Read the plain version
            </Link>
            <a
              href={scUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:text-accent"
            >
              View on SuttaCentral ↗
            </a>
          </div>
        </header>

        <SourceDiff
          rows={rows}
          paliLabel="Pāli (original)"
          tradLabel={`Canonical (${SUJATO_LICENSE.translator})`}
          plainLabel="Plain English"
        />

        <p className="mt-8 font-sans text-xs leading-relaxed text-ink/45">
          Pāli root text: {PALI_LICENSE.edition}, {PALI_LICENSE.license}, via{" "}
          <a
            href={PALI_LICENSE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ink/70"
          >
            {PALI_LICENSE.via}
          </a>
          . Canonical translation by {SUJATO_LICENSE.translator} (
          {SUJATO_LICENSE.license}), via{" "}
          <a
            href={SUJATO_LICENSE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ink/70"
          >
            {SUJATO_LICENSE.via}
          </a>
          . The right-hand column is our own plain retelling, aligned to the
          original by passage — not a literal word-for-word translation.
        </p>

        <nav className="mt-16 grid grid-cols-1 gap-4 border-t border-divider/80 pt-8 sm:grid-cols-2">
          <div>
            {prevSource && (
              <Link
                href={`/${prevSource.slug}/source`}
                className="font-sans group block no-underline hover:no-underline"
              >
                <span className="text-xs uppercase tracking-wider text-ink/65">
                  ← Previous original
                </span>
                <span className="mt-1 block font-serif text-lg text-ink group-hover:text-accent">
                  {prevSource.title}
                </span>
              </Link>
            )}
          </div>
          <div className="sm:text-right">
            {nextSource && (
              <Link
                href={`/${nextSource.slug}/source`}
                className="font-sans group block no-underline hover:no-underline"
              >
                <span className="text-xs uppercase tracking-wider text-ink/65">
                  Next original →
                </span>
                <span className="mt-1 block font-serif text-lg text-ink group-hover:text-accent">
                  {nextSource.title}
                </span>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
