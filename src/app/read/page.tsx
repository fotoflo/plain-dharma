import Link from "next/link";
import type { Metadata } from "next";
import {
  SUTTAS_IN_ORDER,
  loadSutta,
  DEFAULT_LOCALE,
} from "@/content";
import { DROPS } from "@/content/drops";
import { Wash } from "@/components/Wash";
import { Drop } from "@/components/Drop";
import { Preface } from "@/components/Preface";
import { Closing } from "@/components/Closing";

export const metadata: Metadata = {
  title: "Read all six teachings",
  description:
    "The six foundational teachings of the Buddha, in order, in plain modern English.",
};

export default async function ReadPage() {
  const sections = await Promise.all(
    SUTTAS_IN_ORDER.map(async (meta) => ({
      meta,
      Content: await loadSutta(DEFAULT_LOCALE, meta.slug),
    }))
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[16rem_1fr]">
        <aside className="lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:self-start lg:overflow-y-auto">
          <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink/65">
            On this page
          </p>
          <ol className="font-sans mt-4 space-y-3 text-sm">
            {SUTTAS_IN_ORDER.map((s) => (
              <li key={s.slug}>
                <a
                  href={`#${s.slug}`}
                  className="block text-ink/80 no-underline hover:text-accent hover:no-underline"
                >
                  <span className="text-ink/65">
                    {String(s.ordinal).padStart(2, "0")}.{" "}
                  </span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <div>
          <header className="mb-16">
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
              All six teachings
            </p>
            <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
              The Buddha&apos;s foundational teachings
            </h1>
            <p className="mt-4 font-serif text-lg italic leading-relaxed text-ink/70">
              In order, in plain modern English. Roughly an hour to read all
              six.
            </p>
          </header>

          <Preface />

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
                <header className="mb-10 border-t border-divider/80 pt-8">
                  <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
                    {String(meta.ordinal).padStart(2, "0")} ·{" "}
                    {meta.pali_name}
                  </p>
                  <h2 className="mt-3 font-serif text-3xl leading-tight text-ink sm:text-4xl">
                    {meta.title}
                  </h2>
                  <p className="mt-3 font-serif text-base italic leading-relaxed text-ink/70">
                    {meta.subtitle}
                  </p>
                </header>
                <article className="prose-dharma">
                  <Content />
                </article>
                <Drop text={DROPS[meta.slug]} />
                <div className="mt-6 text-right">
                  <Link
                    href={`/${meta.slug}`}
                    className="font-sans text-xs text-link hover:text-accent"
                  >
                    Open this teaching on its own page →
                  </Link>
                </div>
              </section>
            ))}
          </div>

          <Closing />
        </div>
      </div>
    </div>
  );
}
