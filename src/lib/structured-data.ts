import { getMeta, type Locale, type SuttaSlug } from "@/content";
import { getIllustrationUrl } from "@/content/illustrations";
import { CANONICAL_LINKS } from "@plain-dharma/content/canonical-links";
import {
  SITE_NAME,
  SITE_URL,
  SITE_DESCRIPTION,
  LICENSE_URL,
} from "@/lib/og-meta";
import { APP_LINKS } from "@/lib/app-links";
import { BOOK_LINKS, PAPERBACK_ISBN } from "@/lib/book-links";
import { suttaMtime } from "@/lib/sutta-dates";

// Builders return plain JSON-LD nodes (no `@context`); `graph()` wraps a set of
// nodes into one `@graph` document for a single <script> tag. Cross-references
// use stable `@id`s so the Organization is declared once and referenced by the
// WebSite / Article / MobileApplication rather than duplicated.

type JsonLdNode = Record<string, unknown>;

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const LOGO_URL = `${SITE_URL}/logo/plain-dharma-logo.png`;
const REPO_URL = "https://github.com/fotoflo/plain-dharma";

/** schema.org `inLanguage` BCP-47 tags keyed by our internal locale. */
const BCP47: Record<Locale, string> = { en: "en", zh: "zh-Hans" };

const localePrefix = (locale: Locale) => (locale === "zh" ? "/zh" : "");

export function graph(nodes: JsonLdNode[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

export function organizationJsonLd(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
    description: SITE_DESCRIPTION,
    sameAs: [APP_LINKS.ios, APP_LINKS.android, REPO_URL],
  };
}

export function websiteJsonLd(locale: Locale): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: BCP47[locale],
    license: LICENSE_URL,
    publisher: { "@id": ORG_ID },
  };
}

export function mobileApplicationJsonLd(): JsonLdNode {
  return {
    "@type": "MobileApplication",
    name: SITE_NAME,
    operatingSystem: "iOS, Android",
    applicationCategory: "BookApplication",
    inLanguage: [BCP47.en, BCP47.zh],
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    installUrl: APP_LINKS.ios,
    downloadUrl: [APP_LINKS.ios, APP_LINKS.android],
    publisher: { "@id": ORG_ID },
  };
}

/**
 * The book itself: free digital editions here, the paperback sold on Amazon.
 * One node with the paperback as a `workExample` edition, so the Amazon
 * listing and the free downloads are tied to the same work.
 */
export function bookJsonLd(): JsonLdNode {
  return {
    "@type": "Book",
    "@id": `${SITE_URL}/#book`,
    name: SITE_NAME,
    alternateName:
      "Plain Dharma: The Buddha's Foundational Teachings in Modern English",
    url: `${SITE_URL}/download`,
    inLanguage: BCP47.en,
    author: { "@type": "Person", name: "Gautama Buddha" },
    publisher: { "@id": ORG_ID },
    license: LICENSE_URL,
    isAccessibleForFree: true,
    workExample: [
      {
        "@type": "Book",
        bookFormat: "https://schema.org/Paperback",
        isbn: PAPERBACK_ISBN,
        url: BOOK_LINKS.amazonPaperback,
      },
      {
        "@type": "Book",
        bookFormat: "https://schema.org/EBook",
        name: "Kindle edition",
        url: BOOK_LINKS.amazonKindle,
      },
      {
        "@type": "Book",
        bookFormat: "https://schema.org/EBook",
        url: `${SITE_URL}/download`,
        isAccessibleForFree: true,
      },
      {
        "@type": "Audiobook",
        bookFormat: "https://schema.org/AudiobookFormat",
        url: `${SITE_URL}/download`,
        isAccessibleForFree: true,
      },
    ],
  };
}

/** The canonical Pali source this teaching is based on (from canonical-links). */
function paliSource(slug: SuttaSlug): JsonLdNode {
  const entry = CANONICAL_LINKS[slug];
  const suttaCentral = entry.linksByLocale.en.find((l) =>
    l.url.includes("suttacentral.net"),
  )?.url;
  return {
    "@type": "CreativeWork",
    name: entry.paliName,
    alternateName: entry.paliReference,
    ...(suttaCentral ? { url: suttaCentral, sameAs: suttaCentral } : {}),
  };
}

export function suttaJsonLd(locale: Locale, slug: SuttaSlug): JsonLdNode {
  const meta = getMeta(locale, slug);
  const url = `${SITE_URL}${localePrefix(locale)}/${slug}`;
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: meta.title,
    name: meta.title,
    description: meta.subtitle,
    inLanguage: BCP47[locale],
    url,
    mainEntityOfPage: url,
    image: getIllustrationUrl(slug),
    dateModified: suttaMtime(slug, locale).toISOString(),
    // Authored by the Buddha; translated by Claude Opus; edited by the human.
    // The Chinese edition is edited by Yan Zhang rather than Alex Miller.
    author: { "@type": "Person", name: "Gautama Buddha" },
    translator: { "@type": "Person", name: "Claude Opus" },
    editor: {
      "@type": "Person",
      name: locale === "zh" ? "Yan Zhang" : "Alex Miller",
    },
    publisher: { "@id": ORG_ID },
    license: LICENSE_URL,
    isAccessibleForFree: true,
    isBasedOn: paliSource(slug),
  };
}

export function breadcrumbJsonLd(
  items: { name: string; url: string }[],
): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/** Site-wide graph for the root layout: org + website + app + book. */
export function siteJsonLd(locale: Locale) {
  return graph([
    organizationJsonLd(),
    websiteJsonLd(locale),
    mobileApplicationJsonLd(),
    bookJsonLd(),
  ]);
}

/** Per-sutta graph: the article + a Home → Sutta breadcrumb. */
export function suttaPageJsonLd(locale: Locale, slug: SuttaSlug) {
  const meta = getMeta(locale, slug);
  const home = `${SITE_URL}${localePrefix(locale)}/`;
  return graph([
    suttaJsonLd(locale, slug),
    breadcrumbJsonLd([
      { name: SITE_NAME, url: home },
      { name: meta.title, url: `${SITE_URL}${localePrefix(locale)}/${slug}` },
    ]),
  ]);
}
