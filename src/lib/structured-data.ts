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
    author: { "@id": ORG_ID },
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

/** Site-wide graph for the root layout: org + website + app. */
export function siteJsonLd(locale: Locale) {
  return graph([
    organizationJsonLd(),
    websiteJsonLd(locale),
    mobileApplicationJsonLd(),
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
