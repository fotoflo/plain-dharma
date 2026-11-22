import Link from "next/link";
import { getSuttasInOrder, getMeta } from "@plain-dharma/content";
import { CANONICAL_LINKS } from "@plain-dharma/content/canonical-links";
import { assetUrl, hasAsset } from "@plain-dharma/content/assets";
import { Wash } from "@/components/Wash";
import { JsonLd } from "@/components/JsonLd";
import { QuoteActions } from "@/components/QuoteActions";
import { QUOTES, FAKE_QUOTES, getQuote, quoteTopics, topicSlug, type Quote } from "@/content/quotes";
import { SITE_NAME, SITE_URL } from "@/lib/og-meta";
import { breadcrumbJsonLd, graph } from "@/lib/structured-data";

export function shortVideoUrl(q: Quote): string | undefined {
  const path = q.short && `downloads/shorts/${q.short}.mp4`;
  return path && hasAsset(path) ? assetUrl(path) : undefined;
}

/** "SN 56.11", the canonical reference of the sutta a quote comes from. */
export const quoteRef = (q: Quote) => CANONICAL_LINKS[q.sutta].paliReference;

/**
 * The quote graphic as an ImageObject with its licence. Google Images shows a
 * "Licensable" badge for images that carry `license` + `acquireLicensePage`,
 * and the credit line beside them.
 */
export function quoteImageJsonLd(q: Quote, variant: "art" | "photo" = "art") {
  const meta = getMeta("en", q.sutta);
  const file = variant === "photo" ? "buddha-quote-photo.png" : "buddha-quote.png";
  return {
    "@type": "ImageObject",
    "@id": `${SITE_URL}/quotes/${q.id}/${file}`,
    contentUrl: `${SITE_URL}/quotes/${q.id}/${file}`,
    url: `${SITE_URL}/quotes/${q.id}/${file}`,
    width: 1080,
    height: 1080,
    encodingFormat: "image/png",
    name: `Buddha quote on ${q.topics[0]}`,
    caption: `“${q.text}” — the Buddha, ${meta.title} (${quoteRef(q)})`,
    license: "https://creativecommons.org/publicdomain/zero/1.0/",
    acquireLicensePage: `${SITE_URL}/quotes#about`,
    creditText: "Plain Dharma (plaindharma.com)",
    copyrightNotice: "Public domain (CC0). Free to use, no permission needed.",
    creator: { "@type": "Organization", name: "Plain Dharma", url: SITE_URL },
  };
}

/** schema.org Quotation for one quote: shared by /quotes and /quotes/<id>. */
export function quotationJsonLd(q: Quote) {
  const meta = getMeta("en", q.sutta);
  return {
    "@type": "Quotation",
    "@id": `${SITE_URL}/quotes/${q.id}#quote`,
    url: `${SITE_URL}/quotes/${q.id}`,
    text: q.text,
    inLanguage: "en",
    creator: { "@type": "Person", name: "Gautama Buddha", alternateName: "The Buddha" },
    about: q.topics.map((t) => ({ "@type": "Thing", name: t })),
    isPartOf: {
      "@type": "Article",
      "@id": `${SITE_URL}/${q.sutta}#article`,
      name: meta.title,
      alternateName: `${meta.pali_name} (${quoteRef(q)})`,
      url: `${SITE_URL}/${q.sutta}`,
    },
    image: [quoteImageJsonLd(q), quoteImageJsonLd(q, "photo")],
    license: "https://creativecommons.org/publicdomain/zero/1.0/",
    isAccessibleForFree: true,
  };
}

const kicker = "font-sans text-xs font-normal uppercase tracking-[0.2em] text-link";

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Are these real Buddha quotes?",
    a: (
      <>
        Yes. Every line here is taken word for word from a plain-English
        translation of six early Pāli suttas, the oldest record of what the
        Buddha taught. Each quote names the talk it comes from and its
        reference in the Pāli Canon (like SN 56.11), so you can check it
        against the scholarly translations linked on that talk&rsquo;s page.
        Many &ldquo;Buddha quotes&rdquo; that circulate online aren&rsquo;t
        in any sutta; these are.
      </>
    ),
  },
  {
    q: "Can I use these quotes and images?",
    a: (
      <>
        Yes, for anything, with no permission needed. The translation, the
        images and the videos are free (creative commons, dedicated to the
        public domain). A link back to plaindharma.com is welcome but not
        required.
      </>
    ),
  },
  {
    q: "Why do they sound different from other translations?",
    a: (
      <>
        This is a plain modern English rendering, made to read the way
        you&rsquo;d say it yourself. It was drafted with AI from the Pāli and
        then checked line by line against Bhikkhu Bodhi and Ṭhānissaro
        Bhikkhu. <Link href="/how-it-was-made">How it was made</Link> tells
        the whole story.
      </>
    ),
  },
];

/** plaindharma.com/quotes — every pull quote, by teaching and by topic, each ready to share. */
export function QuotesView() {
  const suttas = getSuttasInOrder("en").filter((s) =>
    QUOTES.some((q) => q.sutta === s.slug),
  );
  const topics = quoteTopics();

  const jsonLd = graph([
    {
      "@type": "CollectionPage",
      "@id": `${SITE_URL}/quotes#page`,
      url: `${SITE_URL}/quotes`,
      name: "Real Buddha quotes, in plain English",
      description:
        "Quotes from six early Buddhist suttas, word for word from a plain-English translation, each with its Pāli Canon reference and a free image.",
      inLanguage: "en",
      isAccessibleForFree: true,
      license: "https://creativecommons.org/publicdomain/zero/1.0/",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: QUOTES.length,
        itemListElement: QUOTES.map((q, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: quotationJsonLd(q),
        })),
      },
    },
    breadcrumbJsonLd([
      { name: SITE_NAME, url: `${SITE_URL}/` },
      { name: "Quotes", url: `${SITE_URL}/quotes` },
    ]),
  ]);

  const videoCount = new Set(QUOTES.filter((q) => shortVideoUrl(q)).map((q) => q.short)).size;
  const featured = ["grip", "nothing-to-fear", "mother", "you-looked", "everyone", "two-dead-ends"]
    .map((id) => QUOTES.find((q) => q.id === id))
    .filter((q): q is Quote => Boolean(q));
  const chip =
    "rounded-full border border-divider px-3 py-1 text-ink/80 no-underline hover:border-accent hover:no-underline";

  return (
    <div className="relative mx-auto w-full max-w-6xl overflow-hidden px-6 py-16 sm:py-20">
      <JsonLd data={jsonLd} />
      <Wash size="md" position="top-right" intensity={0.09} />

      {/* Hero: the pitch and the numbers on one side, the graphics on the other. */}
      <header className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <p className={kicker}>Buddha quotes</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-6xl">
            Real Buddha quotes, in plain English
          </h1>
          <p className="mt-5 font-serif text-xl leading-relaxed text-ink/80">
            What the Buddha actually said, word for word from his earliest
            recorded talks, each traced to its place in the Pāli Canon. Not
            the internet&rsquo;s Buddha. The real one, in words you&rsquo;d
            use yourself.
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              [String(QUOTES.length), "real quotes"],
              [String(QUOTES.length * 2), "free images"],
              [String(videoCount), "narrated videos"],
              ["6", "sourced suttas"],
            ].map(([n, label]) => (
              <div key={label} className="rounded-xl border border-divider px-4 py-3">
                <dt className="sr-only">{label}</dt>
                <dd className="font-serif text-3xl text-ink">{n}</dd>
                <p className="font-sans text-xs uppercase tracking-[0.12em] text-ink/60">{label}</p>
              </div>
            ))}
          </dl>
          <p className="mt-6 font-sans text-sm leading-relaxed text-ink/70">
            Every image is 1080×1080 and in the public domain: post it to
            Facebook, Instagram or Pinterest, print it, put it in your
            sangha&rsquo;s newsletter. No permission, no credit required.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 font-sans text-sm">
            <a
              href="#gallery"
              className="rounded-full bg-accent-strong px-5 py-2.5 font-medium text-white no-underline hover:opacity-90 hover:no-underline"
            >
              Browse the quotes
            </a>
            <a href="#fake-buddha-quotes" className={`${chip} px-5 py-2.5`}>
              Quotes he never said
            </a>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {featured.map((q, i) => (
            <Link
              key={q.id}
              href={`/quotes/${q.id}`}
              className={`block overflow-hidden rounded-lg shadow-lg ring-1 ring-divider transition hover:-translate-y-0.5 ${i % 3 === 1 ? "lg:translate-y-6" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/quotes/${q.id}/${i % 3 === 1 ? "buddha-quote.png" : "buddha-quote-photo.png"}`}
                alt={`Buddha quote on ${q.topics[0]}: “${q.text}”`}
                width={1080}
                height={1080}
                className="block aspect-square w-full"
              />
            </Link>
          ))}
        </div>
      </header>

      <nav aria-label="Teachings" id="gallery" className="relative mt-20 flex scroll-mt-24 flex-wrap gap-2 font-sans text-sm">
        {suttas.map((s) => (
          <a key={s.slug} href={`#${s.slug}`} className={chip}>
            {s.title}
          </a>
        ))}
        <a href="#topics" className={chip}>By topic</a>
        <a href="#fake-buddha-quotes" className={chip}>Fake Buddha quotes</a>
      </nav>

      {suttas.map((s) => {
        const meta = getMeta("en", s.slug);
        const ref = CANONICAL_LINKS[s.slug].paliReference;
        return (
          <section key={s.slug} id={s.slug} className="relative mt-16 scroll-mt-24">
            <p className={kicker}>
              {meta.pali_name} · {ref}
            </p>
            <h2 className="mt-2 font-serif text-3xl text-ink">
              Buddha quotes from <Link href={`/${s.slug}`}>{meta.title}</Link>
            </h2>
            <p className="mt-2 max-w-2xl font-serif text-base text-ink/70">{meta.subtitle}</p>
            <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {QUOTES.filter((q) => q.sutta === s.slug).map((q, i) => {
                const video = shortVideoUrl(q);
                return (
                  <li key={q.id} id={q.id} className="flex scroll-mt-24 flex-col">
                    <Link
                      href={`/quotes/${q.id}`}
                      className="relative block overflow-hidden rounded-xl shadow-md ring-1 ring-divider transition hover:-translate-y-0.5 hover:shadow-lg"
                      tabIndex={-1}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/quotes/${q.id}/${i % 2 ? "buddha-quote.png" : "buddha-quote-photo.png"}`}
                        alt={`Buddha quote on ${q.topics[0]}: “${q.text}”`}
                        width={1080}
                        height={1080}
                        loading="lazy"
                        className="block aspect-square w-full"
                      />
                      {video && (
                        <span className="absolute right-3 top-4 rounded-full bg-black/60 px-2.5 py-1 font-sans text-xs text-white">
                          ▶ Video
                        </span>
                      )}
                    </Link>
                    <blockquote className="mt-4 font-serif text-lg leading-relaxed text-ink">
                      <Link href={`/quotes/${q.id}`} className="text-ink no-underline hover:underline">
                        “{q.text}”
                      </Link>
                    </blockquote>
                    <p className="mt-2 font-sans text-xs text-ink/60">
                      {q.topics.map((t, j) => (
                        <span key={t}>
                          {j > 0 && " · "}
                          <a href={`#${topicSlug(t)}`} className="text-ink/60">
                            {t}
                          </a>
                        </span>
                      ))}
                    </p>
                    <div className="mt-3">
                      <QuoteActions id={q.id} text={q.text} source={meta.title} videoUrl={video} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <div className="mx-auto max-w-3xl">
      <section id="topics" className="relative mt-20 scroll-mt-24">
        <p className={kicker}>By topic</p>
        <h2 className="mt-2 font-serif text-2xl text-ink">Buddha quotes by topic</h2>
        <dl className="mt-6 space-y-5">
          {topics.map(({ topic, slug, quotes }) => (
            <div key={topic} id={slug} className="scroll-mt-24">
              <dt className="font-serif text-lg capitalize text-ink">Buddha quotes on {topic}</dt>
              <dd className="mt-1 font-serif text-base text-ink/75">
                <ul className="space-y-1">
                  {quotes.map((q) => (
                    <li key={q.id}>
                      <Link href={`/quotes/${q.id}`}>
                        “{q.text.length > 90 ? q.text.slice(0, 87).trimEnd() + "…" : q.text}”
                      </Link>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="fake-buddha-quotes" className="relative mt-20 scroll-mt-24">
        <p className={kicker}>Fake Buddha quotes</p>
        <h2 className="mt-2 font-serif text-2xl text-ink">Popular quotes the Buddha never said</h2>
        <p className="mt-3 font-serif text-base leading-relaxed text-ink/75">
          Some of the most shared &ldquo;Buddha quotes&rdquo; aren&rsquo;t in
          any early text. Fittingly, he told people not to take a saying on
          trust just because of who it&rsquo;s credited to. Here are a few,
          each with a real line on the same theme. For the evidence on
          hundreds more, see Bodhipaksa&rsquo;s{" "}
          <a href="https://www.fakebuddhaquotes.com/" target="_blank" rel="noopener noreferrer">
            Fake Buddha Quotes
          </a>
          .
        </p>
        <ul className="mt-8 space-y-10">
          {FAKE_QUOTES.map((f) => {
            const real = getQuote(f.real)!;
            const realMeta = getMeta("en", real.sutta);
            return (
              <li key={f.real + f.fake.slice(0, 12)} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="font-sans text-xs uppercase tracking-[0.15em] text-ink/50">Not the Buddha</p>
                  <p className="mt-2 font-serif text-lg leading-relaxed text-ink/60 line-through decoration-ink/30">
                    &ldquo;{f.fake}&rdquo;
                  </p>
                  <p className="mt-2 font-serif text-sm leading-relaxed text-ink/60">{f.note}</p>
                </div>
                <div className="border-l-2 border-accent/60 pl-4">
                  <p className="font-sans text-xs uppercase tracking-[0.15em] text-link">What he did say</p>
                  <p className="mt-2 font-serif text-lg leading-relaxed text-ink">
                    <Link href={`/quotes/${real.id}`} className="text-ink">&ldquo;{real.text}&rdquo;</Link>
                  </p>
                  <p className="mt-2 font-serif text-sm italic text-ink/70">
                    {realMeta.title}, {quoteRef(real)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section id="about" className="relative mt-20 scroll-mt-24">
        <p className={kicker}>Questions</p>
        <h2 className="mt-2 font-serif text-2xl text-ink">About these quotes</h2>
        <div className="mt-6 space-y-6">
          {FAQ.map((f) => (
            <div key={f.q}>
              <h3 className="font-serif text-lg text-ink">{f.q}</h3>
              <p className="mt-1 font-serif text-base leading-relaxed text-ink/75">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="relative mt-16 font-serif text-base leading-relaxed text-ink/70">
        Want the whole teaching around a line? Every quote links back to its
        talk. The full text, the audiobook and the art are all on{" "}
        <Link href="/remix">Remix</Link>, free to use however you like.
      </p>
      </div>
    </div>
  );
}
