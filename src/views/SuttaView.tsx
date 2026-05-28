import Link from "next/link";
import {
  type Locale,
  type SuttaSlug,
  getMeta,
  getNeighbors,
  loadSutta,
} from "@/content";
import { DROPS } from "@plain-dharma/content/drops";
import { getStrings } from "@plain-dharma/content/strings";
import { getAudioManifest } from "@/content/audio";
import { localizedHref } from "@/lib/locale-href";
import { SuttaIllustration } from "@/components/SuttaIllustration";
import { Wash } from "@/components/Wash";
import { Drop } from "@/components/Drop";
import { Preface } from "@/components/Preface";
import { CanonicalLinks } from "@/components/CanonicalLinks";
import { ReadingControls } from "@/components/ReadingControls";
import { FloatingAudioPlayer } from "@/components/FloatingAudioPlayer";

type SuttaViewProps = {
  locale: Locale;
  slug: SuttaSlug;
};

export async function SuttaView({ locale, slug }: SuttaViewProps) {
  const s = getStrings(locale);
  const meta = getMeta(locale, slug);
  const Content = await loadSutta(locale, slug);
  const { prev, next } = getNeighbors(locale, slug);
  const manifest = await getAudioManifest(locale, slug);

  return (
    <>
      <ReadingControls />
      <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
        <header id="title" className="reading-head relative mb-12 overflow-hidden scroll-mt-8">
          {/* Opposite-side composition vs. the homepage hero for visual rhythm */}
          <Wash size="md" position="top-left" intensity={0.1} />
          <SuttaIllustration
            slug={slug}
            alt=""
            width={400}
            height={400}
            priority
            className="mb-8 mx-auto h-auto w-full max-w-[400px]"
          />
          <p className="font-sans text-[0.75em] uppercase tracking-[0.2em] text-link">
            {meta.kicker_override ?? meta.pali_name}
          </p>
          <h1 className="mt-3 font-serif text-[2.25em] leading-tight text-ink sm:text-[3em]">
            {meta.title}
          </h1>
          <p className="mt-4 font-serif text-[1.125em] italic leading-relaxed text-ink/70">
            {meta.subtitle}
          </p>
        </header>

        {manifest && (
          <FloatingAudioPlayer
            manifest={manifest}
            audioBaseUrl={`/audio/${locale}/${slug}`}
            locale={locale}
          />
        )}

        {slug === "first-talk" && (
          <div id="preface" className="scroll-mt-8">
            <Preface locale={locale} />
          </div>
        )}

        <article id="opening" className="prose-dharma scroll-mt-8">
          <Content />
        </article>

        <div id="drop" className="scroll-mt-8">
          <Drop text={DROPS[locale][slug]} />
        </div>

        <CanonicalLinks locale={locale} slug={slug} />

        <nav className="mt-20 grid grid-cols-1 gap-4 border-t border-divider/80 pt-8 sm:grid-cols-2">
          <div>
            {prev ? (
              <Link
                href={localizedHref(locale, prev.slug)}
                className="font-sans group block no-underline hover:no-underline"
              >
                <span className="text-xs uppercase tracking-wider text-ink/65">
                  {s.sutta.previous}
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
                href={localizedHref(locale, next.slug)}
                className="font-sans group block no-underline hover:no-underline"
              >
                <span className="text-xs uppercase tracking-wider text-ink/65">
                  {s.sutta.next}
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
            href={localizedHref(locale, "read")}
            className="font-sans text-sm text-link hover:text-accent"
          >
            {s.sutta.readAllOnOnePage}
          </Link>
        </div>
      </div>
    </>
  );
}
