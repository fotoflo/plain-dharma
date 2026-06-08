import Link from "next/link";
import { assetUrl } from "@plain-dharma/content/assets";
import { getSuttasInOrder, type Locale, type SuttaMeta } from "@/content";
import { getStrings } from "@plain-dharma/content/strings";
import { localizedHref } from "@/lib/locale-href";
import { SuttaIllustration } from "@/components/SuttaIllustration";
import { Wash } from "@/components/Wash";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { StoreBadges } from "@/components/StoreBadges";
import { APP_LINKS } from "@/lib/app-links";

// Editorial layout config for the six hero illustrations.
//
// Order mirrors the page array but each illustration gets its own visual
// treatment — varied size (160–200px) and a small vertical offset — so the
// arrangement reads as a hand-placed editorial composition rather than a
// product grid. Tailwind needs full class strings (no string interpolation)
// for tree-shaking, so we use a discrete set of mt-/mb- values per slot.
type HeroSpot = {
  // Tailwind size pair, applied at lg+. e.g. "lg:h-44 lg:w-44" (~176px).
  sizeClass: string;
  // Vertical stagger applied at lg+ for editorial rhythm.
  offsetClass: string;
};

// Slot 0..2 = top row, 3..5 = bottom row. Sizes vary 160–200px.
const HERO_SPOTS: HeroSpot[] = [
  // Top row
  { sizeClass: "lg:h-44 lg:w-44", offsetClass: "lg:mt-0" },        // ~176px (wheel)
  { sizeClass: "lg:h-40 lg:w-40", offsetClass: "lg:mt-10" },       // ~160px (silhouette), dropped
  { sizeClass: "lg:h-48 lg:w-48", offsetClass: "lg:mt-2" },        // ~192px (flame), slight drop
  // Bottom row
  { sizeClass: "lg:h-44 lg:w-44", offsetClass: "lg:mt-6" },        // ~176px (parent+child)
  { sizeClass: "lg:h-40 lg:w-40", offsetClass: "lg:mt-0" },        // ~160px (eye)
  { sizeClass: "lg:h-48 lg:w-48", offsetClass: "lg:mt-8" },        // ~192px (scale), dropped
];

export function HomeView({ locale }: { locale: Locale }) {
  const s = getStrings(locale);
  const suttasInOrder = getSuttasInOrder(locale);
  const topRow = suttasInOrder.slice(0, 3);
  const bottomRow = suttasInOrder.slice(3, 6);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
      {/* HERO — illustrations + tagline as one editorial composition.
          overflow-hidden clips the absolutely-positioned <Wash> components
          (which intentionally drift off-edge) so they don't push the
          viewport horizontally on mobile. */}
      <section className="relative overflow-hidden">
        <Wash size="lg" position="top-right" intensity={0.11} />
        <Wash size="md" position="bottom-left" intensity={0.08} />

        <p className="font-sans text-center text-sm uppercase tracking-[0.18em] text-link">
          {s.home.kicker}
        </p>

        {/* TOP ROW — three illustrations
            Mobile/sm: 3-up grid sized for the viewport.
            lg+: flex with generous gaps + per-slot vertical offsets. */}
        <div className="mt-8 grid grid-cols-3 items-end justify-items-center gap-4 sm:gap-8 lg:mt-10 lg:flex lg:items-end lg:justify-center lg:gap-20 xl:gap-28">
          {topRow.map((sutta, i) => (
            <HeroIllustration
              key={sutta.slug}
              sutta={sutta}
              spot={HERO_SPOTS[i]}
              locale={locale}
            />
          ))}
        </div>

        {/* TAGLINE — sandwiched between rows */}
        <div className="relative mt-10 text-center lg:mt-14">
          <h1 className="font-serif font-bold text-5xl leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
            <span className="block">{s.home.heroLine1}</span>
            <span className="block">{s.home.heroLine2}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl font-sans text-lg leading-relaxed text-ink/70">
            {s.home.heroSubtitle}
          </p>
        </div>

        {/* BOTTOM ROW — three illustrations */}
        <div className="mt-10 grid grid-cols-3 items-start justify-items-center gap-4 sm:gap-8 lg:mt-14 lg:flex lg:items-start lg:justify-center lg:gap-20 xl:gap-28">
          {bottomRow.map((sutta, i) => (
            <HeroIllustration
              key={sutta.slug}
              sutta={sutta}
              spot={HERO_SPOTS[i + 3]}
              locale={locale}
            />
          ))}
        </div>

        {/* CTAs */}
        <div className="font-sans mt-12 flex flex-wrap items-center justify-center gap-4 lg:mt-16">
          <Link
            href={localizedHref(locale, "read")}
            className="inline-flex items-center justify-center rounded-full bg-accent-strong px-6 py-2.5 text-sm font-medium text-white no-underline hover:no-underline hover:opacity-90"
          >
            {s.home.ctaReadAll}
          </Link>
          {/* Download is EN-only (Stripe carve-out). Always link to the EN
              route regardless of current locale. */}
          <Link
            href="/download"
            className="inline-flex items-center justify-center rounded-full border border-divider px-6 py-2.5 text-sm font-medium text-ink no-underline hover:no-underline hover:border-accent"
          >
            {s.home.ctaDownload}
          </Link>
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center font-serif text-base leading-relaxed text-ink/75 lg:text-lg">
          {s.home.heroBlurb}
        </p>
      </section>

      {/* DOWNLOAD THE BOOK — cover render + formats + store badges, placed
          directly under the hero so it reads above the fold. Shows on both
          locales but always points at the EN download route. */}
      <BookSection locale={locale} />

      {/* APP BAND — the phone + the app pitch + the install CTA. Borderless
          (no card) so it breathes between the bordered book card above and the
          newsletter below rather than stacking a third heavy box. */}
      <AppBand locale={locale} />

      {/* Newsletter signup — placed between the book CTA and the list so it's
          visible above the fold on most desktops but doesn't interrupt the
          editorial composition above. */}
      <section className="mt-20">
        <div className="mx-auto max-w-2xl">
          <NewsletterSignup />
        </div>
      </section>

      {/* Existing list of the six teachings */}
      <section className="mt-20">
        <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-ink/65">
          {s.home.sixTeachingsLabel}
        </h2>
        <ul className="mt-6 divide-y divide-divider/80 border-y border-divider/80">
          {suttasInOrder.map((sutta) => (
            <li key={sutta.slug}>
              <Link
                href={localizedHref(locale, sutta.slug)}
                className="group flex flex-col gap-3 py-8 no-underline hover:no-underline sm:flex-row sm:items-center sm:justify-between sm:gap-8"
              >
                <div className="flex flex-1 items-center gap-5">
                  <SuttaIllustration
                    slug={sutta.slug}
                    alt=""
                    width={80}
                    height={80}
                    className="h-20 w-20 flex-shrink-0 object-contain"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-baseline gap-3">
                      <span className="font-sans text-base font-semibold tracking-wide text-accent">
                        {String(sutta.ordinal).padStart(2, "0")}
                      </span>
                      <h3 className="font-serif text-2xl leading-snug text-ink group-hover:text-accent">
                        {sutta.title}
                      </h3>
                    </div>
                    <p className="font-serif text-base italic text-ink/70">
                      {sutta.teaser}
                    </p>
                  </div>
                </div>
                <span className="font-sans text-xs uppercase tracking-wider text-link sm:flex-shrink-0">
                  {sutta.kicker_override ?? sutta.pali_name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function BookSection({ locale }: { locale: Locale }) {
  const s = getStrings(locale);
  return (
    <section className="relative mt-24 overflow-hidden rounded-2xl border border-divider/70 px-6 py-14 sm:py-16">
      <Wash size="md" position="top-right" intensity={0.07} />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-10 md:flex-row md:gap-14">
        {/* Photorealistic shot of the printed hardcover (shadow + cream baked
            into the image — no CSS faux-3D needed). */}
        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetUrl("downloads/plain-dharma-book-photo.png")}
            alt="Plain Dharma — the printed hardcover"
            width={559}
            height={673}
            className="w-[240px] [filter:drop-shadow(0_16px_24px_rgba(31,24,18,0.28))] sm:w-[280px]"
          />
        </div>

        <div className="text-center md:text-left">
          <h2 className="font-serif text-4xl leading-tight text-ink sm:text-5xl">
            {s.home.bookTitle}
          </h2>
          <p className="mt-4 font-sans text-lg text-ink/70">
            {s.home.bookFormats}
          </p>
          <p className="mt-4 font-serif text-base leading-relaxed text-ink/75">
            {s.home.bookBlurb}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <Link
              href="/download"
              className="inline-flex items-center justify-center rounded-full bg-accent-strong px-6 py-2.5 font-sans text-sm font-medium text-white no-underline hover:no-underline hover:opacity-90"
            >
              {s.home.bookCta}
            </Link>
            <Link
              href={`${localizedHref(locale, "read")}?play=1`}
              className="inline-flex items-center justify-center rounded-full border border-divider px-6 py-2.5 font-sans text-sm font-medium text-ink no-underline hover:no-underline hover:border-accent"
            >
              {s.home.bookCtaListen}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function AppBand({ locale }: { locale: Locale }) {
  const s = getStrings(locale);
  return (
    <section className="relative mt-20 overflow-hidden">
      <Wash size="md" position="bottom-left" intensity={0.06} />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-10 md:flex-row md:gap-16">
        {/* The phone is a pre-framed bare mockup (bezel + soft shadow baked in,
            transparent background) — see packages/store-assets. Plain <img>:
            it's a marketing asset in /public, outside next/image localPatterns. */}
        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/app/listen-phone.png"
            alt="The Plain Dharma app, playing the narrated audiobook"
            width={760}
            height={1543}
            loading="lazy"
            decoding="async"
            className="w-[200px] sm:w-[240px]"
          />
        </div>

        <div className="text-center md:text-left">
          <p className="font-sans text-xs uppercase tracking-[0.2em] text-link">
            {s.home.appBandKicker}
          </p>
          <h2 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
            {s.home.appBandTitle}
          </h2>
          <p className="mt-4 font-serif text-base leading-relaxed text-ink/75 sm:text-lg">
            {s.home.appBandBody}
          </p>
          <div className="mt-7 flex flex-col items-center gap-5 md:items-start">
            {/* Once the App Store listing is approved (APP_LINKS.published),
                StoreBadges renders the official badges; until then we surface
                the live TestFlight public link so people can try the iPhone
                beta now. */}
            {APP_LINKS.published ? (
              <StoreBadges className="justify-center md:justify-start" />
            ) : (
              <a
                href={APP_LINKS.testflight}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-accent-strong px-6 py-2.5 font-sans text-sm font-medium text-white no-underline hover:no-underline hover:opacity-90"
              >
                <AppleIcon className="h-4 w-4" />
                {s.home.appBetaCta}
              </a>
            )}
            {!APP_LINKS.published && (
              <p className="font-sans text-xs text-ink/55">
                {s.home.appBetaNote}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Apple logo glyph for the TestFlight beta link. */
function AppleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 384 512"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

type HeroIllustrationProps = {
  sutta: SuttaMeta;
  spot: HeroSpot;
  locale: Locale;
};

function HeroIllustration({ sutta, spot, locale }: HeroIllustrationProps) {
  return (
    <Link
      href={localizedHref(locale, sutta.slug)}
      aria-label={sutta.title}
      className={[
        "group block no-underline transition-transform duration-300 ease-out hover:no-underline hover:scale-[1.03]",
        // Mobile: scale with the grid column. lg+: fixed size from spot.
        "h-28 w-28 sm:h-32 sm:w-32",
        spot.sizeClass,
        spot.offsetClass,
      ].join(" ")}
    >
      <SuttaIllustration
        slug={sutta.slug}
        alt={sutta.title}
        width={400}
        height={400}
        priority
        className="h-full w-full object-contain drop-shadow-[0_4px_18px_rgba(199,101,28,0)] transition-[filter] duration-300 group-hover:drop-shadow-[0_6px_22px_rgba(199,101,28,0.28)]"
      />
    </Link>
  );
}
