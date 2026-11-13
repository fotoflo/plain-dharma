import Link from "next/link";
import { assetUrl } from "@plain-dharma/content/assets";
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

// plaindharma.com/buy — the short link for emails, posts and print. It is a
// real page, not a redirect, on purpose: the Amazon Associates policies bar
// tagged links in email and links that hide an Amazon destination, so the
// reader lands here and clicks a button that says where it goes. No prices:
// Amazon sets them, and Associates may not show a price that can go stale.
export function BuyView() {
  const s = getStrings("en");
  const button =
    "inline-flex min-w-[15rem] items-center justify-center rounded-full px-6 py-3 font-sans text-sm font-medium no-underline hover:no-underline";
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
          <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
            The book
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
            Plain Dharma
          </h1>
          <p className="mt-4 font-serif text-lg leading-relaxed text-ink/75">
            Six of the Buddha’s foundational teachings in modern English. A
            small paperback you can read in an hour, keep by the bed, or give
            to someone.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 md:items-start">
            <a
              href={BOOK_LINKS.amazonPaperback}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className={`${button} bg-accent-strong text-white hover:opacity-90`}
            >
              Paperback on Amazon
            </a>
            <a
              href={BOOK_LINKS.amazonKindle}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className={`${button} border border-divider text-ink hover:border-accent`}
            >
              Kindle edition on Amazon
            </a>
            <a
              href={AUDIBLE_BOUNTY_URL}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className={`${button} border border-divider text-ink hover:border-accent`}
            >
              Audiobook on Audible
            </a>
          </div>
          <p className="mt-3 font-sans text-xs text-ink/50">
            {s.footer.affiliateLine} The Audible link is a referral link too.
          </p>

          <p className="mt-8 font-serif text-base leading-relaxed text-ink/75">
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
    </div>
  );
}
