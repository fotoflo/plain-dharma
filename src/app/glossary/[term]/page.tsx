import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SUTTAS, getMeta, type SuttaSlug } from "@/content";
import {
  GLOSSARY,
  glossarySlug,
  getGlossaryEntry,
  GLOSSARY_MATCH,
} from "@plain-dharma/content/glossary";
import { getSourceView } from "@plain-dharma/content/source";
import { ogBase, altLanguages, SITE_URL } from "@/lib/og-meta";
import { JsonLd } from "@/components/JsonLd";
import { graph, breadcrumbJsonLd } from "@/lib/structured-data";
import { Wash } from "@/components/Wash";
import { SuttaIllustration } from "@/components/SuttaIllustration";
import { QUOTES, type Quote } from "@/content/quotes";

/**
 * One page per glossary term. The single /glossary page drew impressions for
 * dozens of term-meaning searches but ranked ~60th for each: one long list
 * can't be the best answer to "what does Tathāgata mean". Each term gets its
 * own title, description and DefinedTerm markup. EN only (the ZH glossary
 * stays a single page), so no zh alternate.
 */

export function generateStaticParams() {
  return GLOSSARY.en.map((e) => ({ term: glossarySlug(e.term) }));
}

export const dynamicParams = false;

type Params = { term: string };

/** Plain-text fold for matching: lowercase, no diacritics. */
const fold = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const MAX_PER_SUTTA = 3;

type Passage = {
  n: number; // 1-based row on the /source page (#p-N)
  en: string; // the plain-English sentence the word appears in (or the row's first)
  enHit?: string; // the matched English word, to highlight
  pali?: string; // a few Pāli words around the match
  paliHit?: string;
};

/** The sentence of `text` that contains `needle` (case-insensitive). */
function sentenceWith(text: string, needle: string): string {
  const sentences = text.match(/[^.!?]+[.!?]*["”’]?/g) ?? [text];
  const i = sentences.findIndex((x) => x.toLowerCase().includes(needle));
  if (i === -1) return text.trim();
  // A one- or two-word sentence ("Suffering.") needs the next one for context.
  const own = sentences[i].trim();
  return own.length < 40 && sentences[i + 1] ? `${own} ${sentences[i + 1].trim()}` : own;
}

/** About a dozen Pāli words centred on the first word containing a stem. */
function paliAround(text: string, stems: string[]): { snippet: string; hit: string } | null {
  const words = text.split(/\s+/).filter(Boolean);
  const i = words.findIndex((w) => stems.some((st) => fold(w).includes(st)));
  if (i === -1) return null;
  const from = Math.max(0, i - 5);
  const to = Math.min(words.length, i + 7);
  const snippet = `${from > 0 ? "… " : ""}${words.slice(from, to).join(" ")}${to < words.length ? " …" : ""}`;
  return { snippet, hit: words[i].replace(/[^\p{L}]+$/u, "").replace(/^[^\p{L}]+/u, "") };
}

/**
 * Where a term appears: the source rows (Pāli + our plain English) whose Pāli
 * contains one of the term's stems or whose English uses one of its English
 * names. Read from the alignment data at build time.
 */
function passagesFor(slug: string): { sutta: SuttaSlug; total: number; passages: Passage[] }[] {
  const match = GLOSSARY_MATCH[slug];
  if (!match) return [];
  const stems = match.pali ?? [];
  const names = (match.en ?? []).map((w) => w.toLowerCase());
  const out: { sutta: SuttaSlug; total: number; passages: Passage[] }[] = [];
  for (const sutta of SUTTAS) {
    const rows = getSourceView("en", sutta);
    if (!rows) continue;
    const hits: Passage[] = [];
    rows.forEach((row, i) => {
      const enHit = names.find((w) => row.en.toLowerCase().includes(w));
      const pali = stems.length ? paliAround(row.pali, stems) : null;
      if (!enHit && !pali) return;
      hits.push({
        n: i + 1,
        en: enHit ? sentenceWith(row.en, enHit) : row.en,
        enHit,
        pali: pali?.snippet,
        paliHit: pali?.hit,
      });
    });
    if (hits.length) out.push({ sutta, total: hits.length, passages: hits.slice(0, MAX_PER_SUTTA) });
  }
  return out;
}

/** Wrap the first case-insensitive occurrence of `hit` in <mark>. */
function Highlight({ text, hit }: { text: string; hit?: string }) {
  if (!hit) return <>{text}</>;
  const at = text.toLowerCase().indexOf(hit.toLowerCase());
  if (at === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-sm bg-accent/15 px-0.5 text-ink">{text.slice(at, at + hit.length)}</mark>
      {text.slice(at + hit.length)}
    </>
  );
}

/**
 * The pull quote for a term: one whose topics match the term's, else one that
 * uses its English name, else one from the teaching it comes up in most.
 */
function quoteFor(slug: string, topSutta?: SuttaSlug): Quote | undefined {
  const match = GLOSSARY_MATCH[slug];
  const topics = match?.topics ?? [];
  const names = (match?.en ?? []).map((w) => w.toLowerCase());
  const score = (q: Quote) =>
    (q.topics.some((t) => topics.includes(t)) ? 4 : 0) +
    (names.some((w) => q.text.toLowerCase().includes(w)) ? 2 : 0) +
    (q.sutta === topSutta ? 1 : 0);
  const best = [...QUOTES].sort((a, b) => score(b) - score(a))[0];
  return best && score(best) > 0 ? best : undefined;
}

function clip(text: string, max = 240): string {
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, "")}…` : text;
}

function describe(term: string, definition: string): string {
  const plain = definition.replace(/[“”"]/g, "");
  const text = `${term} meaning in Buddhism: ${plain}`;
  return text.length > 158 ? `${text.slice(0, 155).replace(/\s+\S*$/, "")}…` : text;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { term } = await params;
  const found = getGlossaryEntry(term);
  if (!found) return {};
  const { entry } = found;
  const title = `${entry.term}: Meaning in Buddhism`;
  const description = describe(entry.term, entry.definition);
  const url = `/glossary/${term}`;
  return {
    title,
    description,
    alternates: altLanguages(url, { zh: false }),
    openGraph: { ...ogBase("en"), type: "article", url, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { term } = await params;
  const found = getGlossaryEntry(term);
  if (!found) notFound();
  const { entry, index } = found;
  const zh = GLOSSARY.zh[index];
  const places = passagesFor(term);
  const placeCount = places.reduce((n, p) => n + p.total, 0);
  const topSutta = [...places].sort((a, b) => b.total - a.total)[0]?.sutta;
  const quote = quoteFor(term, topSutta);
  const others = GLOSSARY.en.filter((e) => e.term !== entry.term);
  const url = `${SITE_URL}/glossary/${term}`;

  const jsonLd = graph([
    {
      "@type": "DefinedTerm",
      "@id": `${url}#term`,
      name: entry.term,
      description: entry.definition,
      url,
      inLanguage: "en",
      inDefinedTermSet: {
        "@type": "DefinedTermSet",
        "@id": `${SITE_URL}/glossary#set`,
        name: "Plain Dharma Glossary",
        url: `${SITE_URL}/glossary`,
      },
    },
    breadcrumbJsonLd([
      { name: "Home", url: `${SITE_URL}/` },
      { name: "Glossary", url: `${SITE_URL}/glossary` },
      { name: entry.term, url },
    ]),
  ]);

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden px-6 py-16 sm:py-20">
      <JsonLd data={jsonLd} />
      <Wash size="md" position="top-right" intensity={0.08} />

      <nav className="font-sans text-xs uppercase tracking-[0.2em] text-link">
        <Link href="/glossary" className="hover:text-accent">
          Glossary
        </Link>
      </nav>

      <div className="mt-3 flex items-start justify-between gap-6">
        <div>
          <h1 className="font-serif text-4xl leading-tight text-ink sm:text-5xl">
            {entry.term}
          </h1>
          {entry.pali ? (
            <p className="mt-2 font-serif italic text-ink/65">{entry.pali}</p>
          ) : null}
        </div>
        {topSutta ? (
          <Link href={`/${topSutta}`} className="shrink-0" aria-label={getMeta("en", topSutta).title}>
            <SuttaIllustration
              slug={topSutta}
              alt=""
              width={240}
              height={240}
              sizes="128px"
              priority
              className="h-24 w-24 object-contain sm:h-32 sm:w-32"
            />
          </Link>
        ) : null}
      </div>

      <p className="mt-8 font-serif text-xl leading-relaxed text-ink/90">
        {entry.definition}
      </p>

      {quote ? (
        <figure className="mx-auto mt-12 max-w-sm">
          <Link href={`/quotes/${quote.id}`}>
            {/* The quote's own share graphic (a route image, so a plain img). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/quotes/${quote.id}/buddha-quote.png`}
              alt={`“${quote.text}” — the Buddha, ${getMeta("en", quote.sutta).title}`}
              width={540}
              height={540}
              loading="lazy"
              className="w-full rounded-xl shadow-lg"
            />
          </Link>
          <figcaption className="mt-3 text-center font-sans text-xs text-ink/60">
            From{" "}
            <Link href={`/${quote.sutta}`}>{getMeta("en", quote.sutta).title}</Link>
            {" · "}
            <Link href="/quotes">More quotes</Link>
          </figcaption>
        </figure>
      ) : null}

      {places.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-ink/65">
            Where it appears
          </h2>
          <p className="mt-2 font-serif text-ink/70">
            {placeCount} {placeCount === 1 ? "passage" : "passages"} in{" "}
            {places.length === 6 ? "all six teachings" : `${places.length} of the six teachings`}.
          </p>
          <div className="mt-6 space-y-10">
            {places.map(({ sutta, total, passages }) => (
              <div key={sutta}>
                <h3 className="font-serif text-xl text-ink">
                  <Link href={`/${sutta}`}>{getMeta("en", sutta).title}</Link>
                </h3>
                <ul className="mt-3 space-y-5">
                  {passages.map((p) => (
                    <li key={p.n} className="border-l-2 border-divider pl-4">
                      <p className="font-serif text-lg leading-relaxed text-ink/85">
                        <Highlight text={clip(p.en)} hit={p.enHit} />
                      </p>
                      {p.pali ? (
                        <p className="mt-1 font-serif italic text-ink/60" lang="pi">
                          <Highlight text={p.pali} hit={p.paliHit} />
                        </p>
                      ) : null}
                      <Link
                        href={`/${sutta}/source#p-${p.n}`}
                        className="mt-1 inline-block font-sans text-xs text-link hover:text-accent"
                      >
                        See it beside the Pāli →
                      </Link>
                    </li>
                  ))}
                </ul>
                {total > passages.length ? (
                  <Link
                    href={`/${sutta}/source`}
                    className="mt-3 inline-block font-sans text-sm text-link hover:text-accent"
                  >
                    {total - passages.length} more in this teaching →
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {zh ? (
        <p className="mt-10 font-serif text-ink/70">
          In Chinese:{" "}
          <Link href="/zh/glossary" lang="zh-Hans">
            {zh.term}
          </Link>
        </p>
      ) : null}

      <section className="mt-14 border-t border-divider/70 pt-8">
        <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-ink/65">
          More terms
        </h2>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 font-serif">
          {others.map((e) => (
            <li key={e.term}>
              <Link href={`/glossary/${glossarySlug(e.term)}`}>{e.term}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
