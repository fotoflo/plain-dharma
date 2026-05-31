import Link from "next/link";
import type { Locale } from "@/content";
import { getStrings } from "@plain-dharma/content/strings";
import { localizedHref } from "@/lib/locale-href";
import { Wash } from "@/components/Wash";

export function PrivacyView({ locale }: { locale: Locale }) {
  const s = getStrings(locale);

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden px-6 py-16 sm:py-20">
      <Wash size="md" position="top-right" intensity={0.09} />

      <header className="mb-12">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          {s.privacy.kicker}
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          {s.privacy.h1}
        </h1>
        <p className="mt-3 font-sans text-xs text-ink/50">
          {s.privacy.lastUpdatedLabel}: {s.privacy.lastUpdated}
        </p>
      </header>

      <article className="prose-dharma">
        <p>{s.privacy.pIntro}</p>

        <h2>{s.privacy.h2Analytics}</h2>
        <p>
          {s.privacy.pAnalyticsPrefix}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            {s.privacy.pAnalyticsLinkText}
          </a>
          {s.privacy.pAnalyticsSuffix}
        </p>

        <h2>{s.privacy.h2Accounts}</h2>
        <p>
          {s.privacy.pAccountsPrefix}
          <a
            href="https://supabase.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            {s.privacy.pAccountsLinkText}
          </a>
          {s.privacy.pAccountsSuffix}
        </p>

        <h2>{s.privacy.h2Notes}</h2>
        <p>{s.privacy.pNotes}</p>

        <h2>{s.privacy.h2Sharing}</h2>
        <p>{s.privacy.pSharing}</p>

        <h2>{s.privacy.h2Newsletter}</h2>
        <p>{s.privacy.pNewsletter}</p>

        <h2>{s.privacy.h2Contact}</h2>
        <p>{s.privacy.pContact}</p>

        <h2>{s.privacy.h2Donations}</h2>
        <p>
          {s.privacy.pDonationsPrefix}
          <a
            href="https://stripe.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            {s.privacy.pDonationsLinkText}
          </a>
          {s.privacy.pDonationsSuffix}
        </p>

        <h2>{s.privacy.h2Storage}</h2>
        <p>{s.privacy.pStorage}</p>

        <h2>{s.privacy.h2App}</h2>
        <p>{s.privacy.pApp}</p>

        <h2>{s.privacy.h2Sharing2}</h2>
        <p>{s.privacy.pShare}</p>

        <h2>{s.privacy.h2Children}</h2>
        <p>{s.privacy.pChildren}</p>

        <h2>{s.privacy.h2Choices}</h2>
        <p>
          {s.privacy.pChoicesPrefix}
          <Link href={localizedHref(locale, "contribute")}>
            {s.privacy.pChoicesLinkText}
          </Link>
          {s.privacy.pChoicesSuffix}
        </p>

        <h2>{s.privacy.h2Changes}</h2>
        <p>{s.privacy.pChanges}</p>

        <p>{s.privacy.pLicense}</p>
      </article>
    </div>
  );
}
