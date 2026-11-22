import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMeta } from "@plain-dharma/content";
import { assetUrl, hasAsset } from "@plain-dharma/content/assets";
import { ogBase, altLanguages, SITE_NAME, SITE_URL } from "@/lib/og-meta";
import { breadcrumbJsonLd, graph } from "@/lib/structured-data";
import { Wash } from "@/components/Wash";
import { JsonLd } from "@/components/JsonLd";
import { QuoteActions } from "@/components/QuoteActions";
import { QUOTES, getQuote } from "@/content/quotes";
import { shortVideoUrl, quoteRef, quotationJsonLd } from "@/views/QuotesView";
import { topicSlug } from "@/content/quotes";

export const dynamicParams = false;

const cap = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

export function generateStaticParams() {
  return QUOTES.map((q) => ({ id: q.id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const quote = getQuote((await params).id);
  if (!quote) return {};
  const meta = getMeta("en", quote.sutta);
  const short = quote.text.length > 60 ? quote.text.slice(0, 57).trimEnd() + "…" : quote.text;
  const title = `Buddha Quote on ${cap(quote.topics[0])}: “${short}”`;
  const description = `“${quote.text}” — the Buddha, ${meta.title} (${meta.pali_name}, ${quoteRef(quote)}). A real Buddha quote in plain English, with a free image to share.`;
  const url = `/quotes/${quote.id}`;
  return {
    title,
    description,
    alternates: altLanguages(url, { zh: false }),
    openGraph: { ...ogBase("en"), title, description, url },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function QuotePage({ params }: Props) {
  const quote = getQuote((await params).id);
  if (!quote) notFound();
  const meta = getMeta("en", quote.sutta);
  const video = shortVideoUrl(quote);
  const i = QUOTES.indexOf(quote);
  const prev = QUOTES[(i - 1 + QUOTES.length) % QUOTES.length];
  const next = QUOTES[(i + 1) % QUOTES.length];
  const more = QUOTES.filter((q) => q.sutta === quote.sutta && q.id !== quote.id);

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden px-6 py-16 sm:py-20">
      <JsonLd
        data={graph([
          quotationJsonLd(quote),
          breadcrumbJsonLd([
            { name: SITE_NAME, url: `${SITE_URL}/` },
            { name: "Quotes", url: `${SITE_URL}/quotes` },
            { name: cap(quote.topics[0]), url: `${SITE_URL}/quotes/${quote.id}` },
          ]),
        ])}
      />
      <Wash size="md" position="top-right" intensity={0.09} />

      <p className="relative font-sans text-xs uppercase tracking-[0.2em] text-link">
        <Link href="/quotes">Buddha quotes</Link> · {meta.pali_name} · {quoteRef(quote)}
      </p>

      <blockquote className="relative mt-6 font-serif text-3xl leading-snug text-ink sm:text-4xl">
        “{quote.text}”
      </blockquote>
      <p className="relative mt-4 font-serif text-lg italic text-ink/75">
        — The Buddha, <Link href={`/${quote.sutta}`}>{meta.title}</Link>
      </p>
      <p className="relative mt-2 font-sans text-xs text-ink/60">
        Buddha quote on{" "}
        {quote.topics.map((t, i) => (
          <span key={t}>
            {i > 0 && " · "}
            <Link href={`/quotes#${topicSlug(t)}`} className="text-ink/60">
              {t}
            </Link>
          </span>
        ))}
      </p>

      <div className="relative mt-6">
        <QuoteActions id={quote.id} text={quote.text} source={meta.title} videoUrl={video} />
      </div>

      <div className="relative mt-10 grid gap-6 sm:grid-cols-2">
        <figure className="m-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/quotes/${quote.id}/buddha-quote.png`}
            alt={`Buddha quote on ${quote.topics[0]}: “${quote.text}” — ${meta.title}, ${quoteRef(quote)}`}
            width={1080}
            height={1080}
            className="w-full rounded-md ring-1 ring-divider"
          />
          <figcaption className="mt-2 font-sans text-xs text-ink/60">
            Free to use (public domain).{" "}
            <a href={`/quotes/${quote.id}/buddha-quote.png`} download={`buddha-quote-${quote.id}.png`}>
              Download 1080×1080 PNG
            </a>
          </figcaption>
        </figure>
        <figure className="m-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/quotes/${quote.id}/buddha-quote-photo.png`}
            alt={`Buddha statue with the quote “${quote.text}” — the Buddha, ${meta.title}`}
            width={1080}
            height={1080}
            loading="lazy"
            className="w-full rounded-md ring-1 ring-divider"
          />
          <figcaption className="mt-2 font-sans text-xs text-ink/60">
            Photo by Alex Miller, free to use.{" "}
            <a href={`/quotes/${quote.id}/buddha-quote-photo.png`} download={`buddha-quote-${quote.id}-photo.png`}>
              Download 1080×1080 PNG
            </a>
          </figcaption>
        </figure>
        {video && (
          <video
            src={video}
            poster={hasAsset(`downloads/shorts/${quote.short}.jpg`) ? assetUrl(`downloads/shorts/${quote.short}.jpg`) : undefined}
            controls
            preload="none"
            playsInline
            className="w-full rounded-md bg-black ring-1 ring-divider sm:col-span-2 sm:mx-auto sm:max-h-[640px] sm:w-auto"
          />
        )}
      </div>

      <p className="relative mt-10 font-serif text-base leading-relaxed text-ink/75">
        This line is from <Link href={`/${quote.sutta}`}>{meta.title}</Link>{" "}
        ({meta.pali_name}, {quoteRef(quote)} in the Pāli Canon). {meta.subtitle}{" "}
        Read the whole teaching in plain English, or listen to it, free.
      </p>

      {more.length > 0 && (
        <section className="relative mt-12">
          <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-link">More from this teaching</h2>
          <ul className="mt-4 space-y-3 font-serif text-lg">
            {more.map((q) => (
              <li key={q.id}>
                <Link href={`/quotes/${q.id}`}>“{q.text}”</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="relative mt-12 flex justify-between gap-4 font-sans text-sm">
        <Link href={`/quotes/${prev.id}`}>← Previous</Link>
        <Link href="/quotes">All quotes</Link>
        <Link href={`/quotes/${next.id}`}>Next →</Link>
      </nav>
    </div>
  );
}
