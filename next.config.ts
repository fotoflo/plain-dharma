import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    // Turbopack requires plugin names as strings (functions can't cross the
    // JS<->Rust boundary). Next.js resolves the package internally.
    remarkPlugins: [["remark-frontmatter", ["yaml"]]],
    // rehype-slug adds id="..." to every heading. Powers the AudioPlayer's
    // auto-scroll on per-sutta pages: when audio reaches a new H2 section,
    // the page scrolls to that heading's anchor.
    rehypePlugins: [["rehype-slug"]],
  },
});

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  // Allow phone-on-same-wifi and ngrok hosts to load dev resources (HMR, etc).
  // Without this, Next 16 blocks cross-origin requests to /_next/* with a warning.
  allowedDevOrigins: [
    "192.168.1.140",
    "*.ngrok.app",
    "*.ngrok.io",
    "*.ngrok-free.app",
  ],
  images: {
    // Allow cache-busting `?v=<mtime>` query strings on local illustration URLs.
    // Omitting `search` means any query string is permitted for this pathname.
    localPatterns: [
      {
        pathname: "/illustrations/**",
      },
      {
        pathname: "/logo/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Audio mp3s are large and rarely change between deploys. One week fresh
        // + one day stale-while-revalidate keeps repeat visits cheap without
        // pinning forever (we still update audio occasionally).
        source: "/audio/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default withMDX(nextConfig);
