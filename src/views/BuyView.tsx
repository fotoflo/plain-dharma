import Link from "next/link";
import { assetUrl } from "@plain-dharma/content/assets";
import { getSuttasInOrder } from "@plain-dharma/content";
import { getStrings } from "@plain-dharma/content/strings";
import { Wash } from "@/components/Wash";
import {
  AUDIBLE_BOUNTY_URL,
  BOOK_LINKS,
  BOOK_LINKS_CANONICAL,
} from "@/lib/book-links";

// Amazon's own "write a review" form for the paperback listing (the Kindle
// edition shares its reviews). Untagged: it isn't a purchase link.
const REVIEW_URL = `https://www.amazon.com/review/create-review?asin=${
  BOOK_LINKS_CANONICAL.amazonPaperback.split("/dp/")[1]
}`;

// What readers told the author directly (a message, an email), quoted with
// permission and their name. Never copy reviews or star ratings from the
// Amazon listing here: the Associates policies bar showing those on a site
// that carries tagged links. Add a reader by appending to this list.
const READER_QUOTES: {
  quote: string;
  name: string;
  note?: string;
  work?: { title: string; href: string };
}[] = [
  {
    // Same wording as the home page's testimonial.
    quote:
      "I picked up the book to have a look, and I unintentionally read the whole thing. I really enjoyed it and found it very soothing.",
    name: "Romi Grossberg",
    note: "author of",
    work: { title: "Hip Hop & Hope", href: "https://www.romigrossberg.com/" },
  },
];

const BUTTON =
  "inline-flex min-w-[15rem] items-center justify-center rounded-full px-6 py-3 font-sans text-sm font-medium no-underline hover:no-underline";

function BuyButtons() {
  return (
    <>
      <a
        href={BOOK_LINKS.amazonPaperback}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`${BUTTON} bg-accent-strong text-white hover:opacity-90`}
      >
        Paperback on Amazon
      </a>
      <a
        href={BOOK_LINKS.amazonKindle}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`${BUTTON} border border-divider text-ink hover:border-accent`}
      >
        Kindle edition on Amazon
      </a>
      <a
        href={AUDIBLE_BOUNTY_URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`${BUTTON} border border-divider text-ink hover:border-accent`}
      >
        Audiobook on Audible
      </a>
    </>
  );
}

// plaindharma.com/buy — the short link for emails, posts and print. It is a
// real page, not a redirect, on purpose: the Amazon Associates policies bar
// tagged links in email and links that hide an Amazon destination, so the
// reader lands here and clicks a button that says where it goes. No prices:
// Amazon sets them, and Associates may not show a price that can go stale.
//
// Order is the pitch: what it is and the buttons, a reader's word, what's
// inside, who it's for, the buttons again, then the quiet asks (review, free).
export function BuyView() {
  const s = getStrings("en");
  const suttas = getSuttasInOrder("en");
  const kicker = "font-sans text-xs font-normal uppercase tracking-[0.2em] text-link";
  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden px-6 py-16 sm:py-20">
      <Wash size="md" position="top-right" intensity={0.09} />

      <div className="relative flex flex-col items-center gap-10 md:flex-row md:items-start md:gap-14">
        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetUrl("downloads/plain-dharma-cover.jpg")}
            alt="Plain Dharma — the book cover"
            width={1600}
            height={2400}
            className="w-[220px] rounded-[3px] [filter:drop-shadow(0_16px_24px_rgba(31,24,18,0.28))] dark:[filter:brightness(0.93)_drop-shadow(0_18px_28px_rgba(0,0,0,0.55))] dark:ring-1 dark:ring-white/10 sm:w-[260px]"
          />
        </div>

        <div className="text-center md:text-left">
          <p className={kicker}>The book</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
            What the Buddha said, in words you’d use yourself
          </h1>
          <p className="mt-4 font-serif text-lg leading-relaxed text-ink/75">
            Plain Dharma is six of his foundational teachings in modern
            English: the first talks he gave, his guide to mindfulness, and
            his case for thinking for yourself. A small paperback you can
            read in an hour and come back to for years.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 md:items-start">
            <BuyButtons />
          </div>
          {/* A link only: no rating or count stated. Amazon's affiliate API
              (Creators API) has no reviews resource, and the Associates
              policies bar showing a rating that didn't come through it. */}
          <p className="mt-4 font-sans text-sm">
            <a
              href={`${BOOK_LINKS.amazonPaperback}#customerReviews`}
              target="_blank"
              rel="noopener noreferrer sponsored"
            >
              Read the reviews on Amazon
            </a>
          </p>
          <p className="mt-3 font-sans text-xs text-ink/50">
            {s.footer.affiliateLine} The Audible link is a referral link too.
          </p>
        </div>
      </div>

      <section
        aria-labelledby="readers-heading"
        className="relative mt-16 border-t border-divider pt-12 text-center"
      >
        <h2 id="readers-heading" className={kicker}>
          What readers say
        </h2>
        <div className="mx-auto mt-8 flex max-w-xl flex-col gap-12">
          {READER_QUOTES.map((r) => (
            <figure key={r.name}>
              <blockquote className="font-serif text-xl italic leading-relaxed text-ink sm:text-2xl">
                “{r.quote}”
              </blockquote>
              <figcaption className="mt-4 font-sans text-sm text-ink/60">
                {r.name}
                {r.note ? `, ${r.note}` : ""}
                {r.work ? (
                  <>
                    {" "}
                    <a href={r.work.href} target="_blank" rel="noopener">
                      {r.work.title}
                    </a>
                  </>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="inside-heading"
        className="relative mt-16 border-t border-divider pt-12"
      >
        <h2 id="inside-heading" className={`${kicker} text-center`}>
          Six teachings inside
        </h2>
        <ol className="mx-auto mt-8 grid max-w-2xl list-none gap-x-10 gap-y-6 p-0 sm:grid-cols-2">
          {suttas.map((m) => (
            <li key={m.slug} className="flex gap-4">
              <span className="font-serif text-2xl leading-none text-link">
                {m.ordinal}
              </span>
              <span>
                <span className="block font-serif text-lg leading-snug text-ink">
                  {m.title}
                </span>
                <span className="mt-1 block font-serif text-base leading-relaxed text-ink/70">
                  {m.teaser}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="why-heading"
        className="relative mt-16 border-t border-divider pt-12"
      >
        <h2 id="why-heading" className={`${kicker} text-center`}>
          Why this one
        </h2>
        <dl className="mx-auto mt-8 grid max-w-2xl gap-8 sm:grid-cols-3">
          {[
            [
              "Plain words",
              "Suffering, wanting, letting go. No untranslated terms to look up.",
            ],
            [
              "An hour, start to finish",
              "Short enough to read in one sitting, and to read again.",
            ],
            [
              "Made to be given",
              "Small and inexpensive. Buy one for a friend who is curious.",
            ],
          ].map(([t, d]) => (
            <div key={t} className="text-center sm:text-left">
              <dt className="font-serif text-lg text-ink">{t}</dt>
              <dd className="mt-2 font-serif text-base leading-relaxed text-ink/70">
                {d}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 flex flex-col items-center gap-3">
          <BuyButtons />
        </div>
      </section>

      <div className="relative mt-16 border-t border-divider pt-10 text-center">
        <p className="font-serif text-base leading-relaxed text-ink/75">
          Already read it? An{" "}
          <a href={REVIEW_URL} target="_blank" rel="noopener noreferrer">
            honest review on Amazon
          </a>{" "}
          is how strangers find a small book.
        </p>
        <p className="mt-3 font-serif text-base leading-relaxed text-ink/75">
          Every format is also free: <Link href="/read">read it here</Link>,
          or <Link href="/download">download the ebook and audiobook</Link>.
        </p>
      </div>
    </div>
  );
}
