import type { MetadataRoute } from "next";
import { statSync } from "node:fs";
import { join } from "node:path";
import { SUTTAS } from "@/content";

const SITE_URL = "https://plaindharma.com";

/**
 * Sutta pages get their lastModified from the MDX source file mtime so search
 * engines see real change dates. Static pages use build time — they update
 * whenever the codebase rebuilds, which is close enough.
 *
 * Donation/thank-you routes are intentionally omitted (noindex anyway).
 *
 * ZH counterparts are included for every EN page except /download (Stripe
 * carve-out, EN-only). ZH priorities are nudged 0.1 below their EN twin.
 */
function suttaMtime(slug: string, locale: "en" | "zh" = "en"): Date {
  try {
    return statSync(
      join(process.cwd(), "src", "content", locale, `${slug}.mdx`)
    ).mtime;
  } catch {
    return new Date();
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    // EN
    { url: `${SITE_URL}/`,         lastModified: now, changeFrequency: "monthly", priority: 1.0 },
    { url: `${SITE_URL}/read`,     lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/about`,    lastModified: now, changeFrequency: "yearly",  priority: 0.6 },
    { url: `${SITE_URL}/glossary`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/download`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contribute`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    // ZH (no /zh/download — EN-only Stripe flow)
    { url: `${SITE_URL}/zh`,          lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/zh/read`,     lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/zh/about`,    lastModified: now, changeFrequency: "yearly",  priority: 0.5 },
    { url: `${SITE_URL}/zh/glossary`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/zh/contribute`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
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

  return [...staticPages, ...enSuttaPages, ...zhSuttaPages];
}
