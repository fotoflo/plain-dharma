import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    // Turbopack requires plugin names as strings (functions can't cross the
    // JS<->Rust boundary). Next.js resolves the package internally.
    remarkPlugins: [["remark-frontmatter", ["yaml"]]],
    rehypePlugins: [],
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
};

export default withMDX(nextConfig);
