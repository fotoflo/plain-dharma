import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import {
  getSuttasInOrder,
  loadSutta,
  type Locale,
} from "@/content";
import { DROPS } from "@/content/drops";
import { getStrings } from "@/content/strings";
import { getCombinedAudioManifest } from "@/content/audio";
import { localizedHref } from "@/lib/locale-href";
import { Wash } from "@/components/Wash";
import { Drop } from "@/components/Drop";
import { Preface } from "@/components/Preface";
import { Closing } from "@/components/Closing";
import { ReadingControls } from "@/components/ReadingControls";
import { FloatingAudioPlayer } from "@/components/FloatingAudioPlayer";

// Six MDX files render on a single page, so `rehype-slug`'s per-file
// deduping isn't enough — multiple suttas share H2 text like "How They
// Heard It". Prefix every heading id with the sutta slug so they stay
// unique AND match the combined-audio manifest's "{slug}--{section}" ids.
function prefixedMdxComponents(slug: string) {
  const prefix = (id: string | undefined) => (id ? `${slug}--${id}` : undefined);
  return {
    h2: ({ id, ...props }: ComponentPropsWithoutRef<"h2">) => (
      <h2 id={prefix(id)} {...props} />
    ),
    h3: ({ id, ...props }: ComponentPropsWithoutRef<"h3">) => (
      <h3 id={prefix(id)} {...props} />
    ),
  };
}

export async function ReadView({ locale }: { locale: Locale }) {
  const s = getStrings(locale);
  const suttasInOrder = getSuttasInOrder(locale);
  const [sections, combinedAudio] = await Promise.all([
    Promise.all(
      suttasInOrder.map(async (meta) => ({
        meta,
        Content: await loadSutta(locale, meta.slug),
      }))
    ),
    getCombinedAudioManifest(locale),
  ]);

  return (
    <>
      <ReadingControls />
      {combinedAudio && (
        <FloatingAudioPlayer
          manifest={combinedAudio}
          audioBaseUrl=""
          locale={locale}
        />
      )}
      <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[16rem_1fr]">
          <aside className="lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:self-start lg:overflow-y-auto">
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink/65">
              {s.read.onThisPage}
            </p>
            <ol className="font-sans mt-4 space-y-3 text-sm">
              {suttasInOrder.map((sutta) => (
                <li key={sutta.slug}>
                  <a
                    href={`#${sutta.slug}`}
                    className="block text-ink/80 no-underline hover:text-accent hover:no-underline"
                  >
                    <span className="text-ink/65">
                      {String(sutta.ordinal).padStart(2, "0")}.{" "}
                    </span>
                    {sutta.title}
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          <div>
            <header className="mb-16">
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
                {s.read.kicker}
              </p>
              <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
                {s.read.h1}
              </h1>
              <p className="mt-4 font-serif text-lg italic leading-relaxed text-ink/70">
                {s.read.subtitle}
              </p>
            </header>

            <div className="space-y-24">
              {sections.map(({ meta, Content }, idx) => (
                <section
                  key={meta.slug}
                  id={meta.slug}
                  className="relative overflow-hidden scroll-mt-12"
                >
                  {/* Chapter-opener wash — alternates side per section for rhythm */}
                  <Wash
                    size="sm"
                    position={idx % 2 === 0 ? "top-right" : "top-left"}
                    intensity={0.09}
                  />
                  <header
                    id={`${meta.slug}--title`}
                    className="reading-head mb-10 border-t border-divider/80 pt-8 scroll-mt-12"
                  >
                    <p className="font-sans text-[0.75em] uppercase tracking-[0.2em] text-link">
                      {String(meta.ordinal).padStart(2, "0")} ·{" "}
                      {meta.kicker_override ?? meta.pali_name}
                    </p>
                    <h2 className="mt-3 font-serif text-[1.875em] leading-tight text-ink sm:text-[2.25em]">
                      {meta.title}
                    </h2>
                    <p className="mt-3 font-serif text-[1em] italic leading-relaxed text-ink/70">
                      {meta.subtitle}
                    </p>
                  </header>
                  {meta.slug === "first-talk" && (
                    <div id="first-talk--preface" className="scroll-mt-12">
                      <Preface locale={locale} />
                    </div>
                  )}
                  <article
                    id={`${meta.slug}--opening`}
                    className="prose-dharma scroll-mt-12"
                  >
                    <Content components={prefixedMdxComponents(meta.slug)} />
                  </article>
                  <div id={`${meta.slug}--drop`} className="scroll-mt-12">
                    <Drop text={DROPS[locale][meta.slug]} />
                  </div>
                  <div className="mt-6 text-right">
                    <Link
                      href={localizedHref(locale, meta.slug)}
                      className="font-sans text-xs text-link hover:text-accent"
                    >
                      {s.read.openOnOwnPage}
                    </Link>
                  </div>
                </section>
              ))}
            </div>

            <Closing locale={locale} />
          </div>
        </div>
      </div>
    </>
  );
}
