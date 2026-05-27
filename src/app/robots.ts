import type { MetadataRoute } from "next";

const SITE_URL = "https://plaindharma.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Don't index the donation interstitial or the post-payment auto-download
      // page — they're transactional, not destinations.
      disallow: ["/download/donate", "/download/thank-you", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
