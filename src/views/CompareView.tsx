import Link from "next/link";
import { type SuttaSlug, getMeta, loadSutta } from "@/content";
import { getCanonical } from "@/content/canonical";

type CompareViewProps = {
  slug: SuttaSlug;
};

// Side-by-side reading view: our plain-English translation next to Bhikkhu
// Sujato's canonical English and the Pāli root, pulled from SuttaCentral (both
// CC0). Sujato + Pāli are segment-aligned per paragraph; our translation is free
// prose, so it flows in its own column rather than locking row-for-row.
export async function CompareView({ slug }: CompareViewProps) {
  const meta = getMeta("en", slug);
  const canonical = getCanonical(slug);
  const Content = await loadSutta("en", slug);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
      <header className="mb-10">
        <Link
          href={`/${slug}`}
          className="font-sans text-sm text-link hover:text-accent"
        >
          ← {meta.title}
        </Link>
        <h1 className="mt-4 font-serif text-[2rem] leading-tight text-ink sm:text-[2.5rem]">
          Read side by side
        </h1>
        <p className="mt-3 font-sans text-sm text-ink/70">
          Our plain-English {meta.title}, beside Bhikkhu Sujato’s canonical
          translation and the Pāli root ({meta.pali_name}).
        </p>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr_1fr] lg:gap-8">
        {/* Column 1: our plain translation (flows independently) */}
        <section aria-label="Plain Dharma translation" className="lg:order-1">
          <h2 className="mb-4 border-b border-divider pb-2 font-sans text-xs uppercase tracking-[0.18em] text-link">
            Plain Dharma
          </h2>
          <article className="prose-dharma prose-sm">
            <Content />
          </article>
        </section>

        {/* Columns 2 + 3: Sujato + Pāli, paragraph-aligned to each other */}
        <section
          aria-label="Canonical translation and Pāli"
          className="lg:order-2 lg:col-span-2"
        >
          <div className="mb-4 grid grid-cols-2 gap-8 border-b border-divider pb-2">
            <h2 className="font-sans text-xs uppercase tracking-[0.18em] text-link">
              Bhikkhu Sujato
            </h2>
            <h2 className="font-sans text-xs uppercase tracking-[0.18em] text-link">
              Pāli
            </h2>
          </div>
          <div className="space-y-5">
            {canonical.paragraphs.map((p) => (
              <div key={p.id} className="grid grid-cols-2 gap-8">
                <p className="font-serif text-[0.95rem] leading-relaxed text-ink/90">
                  {p.en}
                </p>
                <p
                  lang="pi"
                  className="font-serif text-[0.95rem] italic leading-relaxed text-ink/70"
                >
                  {p.pali}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="mt-16 border-t border-divider pt-6 font-sans text-xs leading-relaxed text-ink/60">
        <p>
          Canonical English by{" "}
          <a
            href={canonical.source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:text-accent"
          >
            {canonical.translationAuthor}
          </a>{" "}
          and Pāli root ({canonical.paliAuthor}), via{" "}
          <a
            href="https://suttacentral.net"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:text-accent"
          >
            SuttaCentral
          </a>
          . Both are dedicated to the public domain (CC0).
        </p>
      </footer>
    </div>
  );
}
