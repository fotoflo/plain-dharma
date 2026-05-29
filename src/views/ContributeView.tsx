import type { Locale } from "@/content";
import { getStrings } from "@plain-dharma/content/strings";
import { Wash } from "@/components/Wash";
import { ContactForm } from "@/components/ContactForm";

export function ContributeView({ locale }: { locale: Locale }) {
  const s = getStrings(locale);

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden px-6 py-16 sm:py-20">
      <Wash size="md" position="top-right" intensity={0.09} />

      <header className="mb-12">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
          {s.contribute.kicker}
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          {s.contribute.h1}
        </h1>
      </header>

      <article className="prose-dharma">
        <p>{s.contribute.pHelpIntro}</p>
        <ul>
          <li>
            <strong>{s.contribute.liCopyEditorsLabel}</strong>
            {s.contribute.liCopyEditorsBody}
          </li>
          <li>
            <strong>{s.contribute.liTranslatorsLabel}</strong>
            {s.contribute.liTranslatorsBody}
          </li>
          <li>
            <strong>{s.contribute.liVoiceArtistsLabel}</strong>
            {s.contribute.liVoiceArtistsBody}
          </li>
        </ul>
        <p>{s.contribute.pHelpClosing}</p>
      </article>

      <div className="mt-12">
        <ContactForm />
      </div>
    </div>
  );
}
