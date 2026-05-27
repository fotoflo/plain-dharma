import Link from "next/link";
import type { Locale } from "@/content";
import { GLOSSARY } from "@/content/glossary";
import { getStrings } from "@/content/strings";
import { localizedHref } from "@/lib/locale-href";
import { Wash } from "@/components/Wash";

export function GlossaryView({ locale }: { locale: Locale }) {
  const s = getStrings(locale);
  const entries = GLOSSARY[locale];

  return (
    <div className="relative mx-auto w-full max-w-5xl overflow-hidden px-6 py-16 sm:py-20">
      <Wash size="md" position="top-right" intensity={0.08} />

      <header className="mb-12 max-w-3xl">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          {s.nav.glossary}
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          {s.nav.glossary}
        </h1>
        <p className="mt-4 font-serif text-lg italic leading-relaxed text-ink/70">
          {s.glossary.subtitle}
        </p>
      </header>

      <dl className="divide-y divide-divider/70 border-t border-divider/70">
        {entries.map((entry) => (
          <div
            key={entry.term}
            className="grid grid-cols-1 gap-2 py-6 lg:grid-cols-[18rem_1fr] lg:gap-12"
          >
            <dt className="font-serif text-xl text-ink">
              <span className="font-semibold">{entry.term}</span>
              {entry.pali ? (
                <span className="mt-1 block font-sans text-xs uppercase tracking-wider text-ink/65">
                  <em className="font-serif normal-case tracking-normal">
                    {entry.pali}
                  </em>
                </span>
              ) : null}
            </dt>
            <dd className="font-serif text-base leading-relaxed text-ink/85 lg:text-lg">
              {entry.definition}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-16 text-center">
        <Link
          href={localizedHref(locale, "read")}
          className="font-sans text-sm text-link hover:text-accent"
        >
          {s.sutta.readAllOnOnePage}
        </Link>
      </div>
    </div>
  );
}
