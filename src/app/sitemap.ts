import type { MetadataRoute } from "next";
import { SUTTAS } from "@/content";
import { sourceSlugs } from "@plain-dharma/content/source";
import { suttaMtime } from "@/lib/sutta-dates";

const SITE_URL = "https://plaindharma.com";

/**
 * Sutta pages get their lastModified from the MDX source file mtime (via the
 * shared `suttaMtime` helper, also used by Article structured data) so search
 * engines see real change dates. Static pages use build time — they update
 * whenever the codebase rebuilds, which is close enough.
 *
 * Donation/thank-you routes are intentionally omitted (noindex anyway).
 *
 * ZH counterparts are included for every EN page except /download (Stripe
 * carve-out, EN-only) and /remix (asset hub, EN-only — the assets it links
 * cover both locales). ZH priorities are nudged 0.1 below their EN twin.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    // EN
    { url: `${SITE_URL}/`,         lastModified: now, changeFrequency: "monthly", priority: 1.0 },
    { url: `${SITE_URL}/read`,     lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/about`,    lastModified: now, changeFrequency: "yearly",  priority: 0.6 },
    // EN-only narrative page (screenshots + manuscript photos are of the English work)
    { url: `${SITE_URL}/how-it-was-made`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/glossary`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/download`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/remix`,    lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contribute`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`,  lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    // ZH (no /zh/download — EN-only Stripe flow)
    { url: `${SITE_URL}/zh`,          lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/zh/read`,     lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/zh/about`,    lastModified: now, changeFrequency: "yearly",  priority: 0.5 },
    { url: `${SITE_URL}/zh/glossary`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/zh/contribute`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/zh/privacy`,  lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
  ];

  const enSuttaPages: MetadataRoute.Sitemap = SUTTAS.map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    lastModified: suttaMtime(slug, "en"),
    changeFrequency: "yearly" as const,
    priority: 0.8,
  }));

  const zhSuttaPages: MetadataRoute.Sitemap = SUTTAS.map((slug) => ({
    url: `${SITE_URL}/zh/${slug}`,
    lastModified: suttaMtime(slug, "zh"),
    changeFrequency: "yearly" as const,
    priority: 0.7,
  }));

  // Parallel Pāli ↔ plain-English source pages, for every sutta that has a
  // published alignment. Lower priority than the reading page they accompany.
  const sourcePages: MetadataRoute.Sitemap = sourceSlugs("en").map((slug) => ({
    url: `${SITE_URL}/${slug}/source`,
    lastModified: suttaMtime(slug, "en"),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...enSuttaPages, ...zhSuttaPages, ...sourcePages];
}
