import Link from "next/link";
import type { Locale } from "@/content";
import { getStrings } from "@/content/strings";
import { localizedHref } from "@/lib/locale-href";
import { Wash } from "@/components/Wash";

export function AboutView({ locale }: { locale: Locale }) {
  const s = getStrings(locale);

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden px-6 py-16 sm:py-20">
      <Wash size="md" position="top-right" intensity={0.09} />

      <header className="mb-12">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          {s.about.kicker}
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          {s.about.h1}
        </h1>
      </header>

      <article className="prose-dharma">
        <p>{s.about.p1}</p>

        <p>{s.about.p2}</p>

        <p>{s.about.p3PreservedStripped}</p>

        <h2>{s.about.h2WhySix}</h2>
        <p>{s.about.pWhySix1}</p>

        <p>{s.about.pWhySix2}</p>

        <h2>{s.about.h2License}</h2>
        <p>
          {s.about.pLicense1Prefix}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {s.about.pLicense1LinkText}
          </a>
          {s.about.pLicense1Suffix}
        </p>

        <p>{s.about.pLicense2}</p>

        <h2>{s.about.h2GoingDeeper}</h2>
        <p>{s.about.pGoingDeeperIntro}</p>

        <ul>
          <li>
            <a
              href="https://suttacentral.net"
              target="_blank"
              rel="noopener noreferrer"
            >
              {s.about.liSuttaCentralLink}
            </a>
            {s.about.liSuttaCentralSuffix}
          </li>
          <li>
            <a
              href="https://accesstoinsight.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              {s.about.liAccessToInsightLink}
            </a>
            {s.about.liAccessToInsightSuffix}
          </li>
          <li>{s.about.liBodhiBooks}</li>
        </ul>

        <p>
          {s.about.pGlossaryRefPrefix}
          <Link href={localizedHref(locale, "glossary")}>
            {s.about.pGlossaryRefLinkText}
          </Link>
          {s.about.pGlossaryRefSuffix}
        </p>
      </article>

      <div className="mt-16 text-center">
        <Link
          href={localizedHref(locale, "read")}
          className="font-sans text-sm text-link hover:text-accent"
        >
          {s.about.ctaStartReading}
        </Link>
      </div>
    </div>
  );
}
