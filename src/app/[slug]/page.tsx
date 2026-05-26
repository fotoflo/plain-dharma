import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  SUTTAS,
  type SuttaSlug,
  isSuttaSlug,
  getMeta,
  getNeighbors,
  loadSutta,
  DEFAULT_LOCALE,
} from "@/content";
import { DROPS } from "@/content/drops";
import { getAudioManifest } from "@/content/audio";
import { SuttaIllustration } from "@/components/SuttaIllustration";
import { Wash } from "@/components/Wash";
import { Drop } from "@/components/Drop";
import { CanonicalLinks } from "@/components/CanonicalLinks";
import { ReadingControls } from "@/components/ReadingControls";
import { FloatingAudioPlayer } from "@/components/FloatingAudioPlayer";

export function generateStaticParams() {
  return SUTTAS.map((slug) => ({ slug }));
}

export const dynamicParams = false;

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isSuttaSlug(slug)) return {};
  const meta = getMeta(slug);
  return {
    title: meta.title,
    description: meta.subtitle,
  };
}

export default async function SuttaPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  if (!isSuttaSlug(slug)) notFound();
  const safeSlug = slug as SuttaSlug;
  const locale = DEFAULT_LOCALE;
  const meta = getMeta(safeSlug);
  const Content = await loadSutta(locale, safeSlug);
  const { prev, next } = getNeighbors(safeSlug);
  const manifest = await getAudioManifest(locale, safeSlug);

  return (
    <>
    <ReadingControls />
    <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
      <header className="relative mb-12 overflow-hidden">
        {/* Opposite-side composition vs. the homepage hero for visual rhythm */}
        <Wash size="md" position="top-left" intensity={0.1} />
        <SuttaIllustration
          slug={safeSlug}
          alt=""
          width={400}
          height={400}
          priority
          className="mb-8 mx-auto h-auto w-full max-w-[400px]"
        />
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          {meta.pali_name}
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          {meta.title}
        </h1>
        <p className="mt-4 font-serif text-lg italic leading-relaxed text-ink/70">
          {meta.subtitle}
        </p>
      </header>

      {manifest && (
        <FloatingAudioPlayer
          manifest={manifest}
          audioBaseUrl={`/audio/${locale}/${safeSlug}`}
        />
      )}

      <article className="prose-dharma">
        <Content />
      </article>

      <Drop text={DROPS[safeSlug]} />

      <CanonicalLinks slug={safeSlug} />

      <nav className="mt-20 grid grid-cols-1 gap-4 border-t border-divider/80 pt-8 sm:grid-cols-2">
        <div>
          {prev ? (
            <Link
              href={`/${prev.slug}`}
              className="font-sans group block no-underline hover:no-underline"
            >
              <span className="text-xs uppercase tracking-wider text-ink/65">
                Previous
              </span>
              <span className="mt-1 block font-serif text-lg text-ink group-hover:text-accent">
                {prev.title}
              </span>
            </Link>
          ) : null}
        </div>
        <div className="sm:text-right">
          {next ? (
            <Link
              href={`/${next.slug}`}
              className="font-sans group block no-underline hover:no-underline"
            >
              <span className="text-xs uppercase tracking-wider text-ink/65">
                Next
              </span>
              <span className="mt-1 block font-serif text-lg text-ink group-hover:text-accent">
                {next.title}
              </span>
            </Link>
          ) : null}
        </div>
      </nav>

      <div className="mt-12 text-center">
        <Link
          href="/read"
          className="font-sans text-sm text-link hover:text-accent"
        >
          Read all six on one page →
        </Link>
      </div>
    </div>
    </>
  );
}
