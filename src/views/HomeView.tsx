import Link from "next/link";
import { getSuttasInOrder, type Locale, type SuttaMeta } from "@/content";
import { getStrings } from "@/content/strings";
import { localizedHref } from "@/lib/locale-href";
import { SuttaIllustration } from "@/components/SuttaIllustration";
import { Wash } from "@/components/Wash";
import { NewsletterSignup } from "@/components/NewsletterSignup";

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

      {/* Newsletter signup — placed between the hero and the list so it's
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
