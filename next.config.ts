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
  // The canonical sutta content (TS registry + `.mdx`) lives in the shared
  // `@plain-dharma/content` workspace package. Next won't compile files inside
  // a package by default, so transpile it — this is what lets the MDX `LOADERS`
  // in src/content/index.ts `import()` the package's `.mdx` through @next/mdx.
  transpilePackages: ["@plain-dharma/content"],
  // Allow phone-on-same-wifi and ngrok hosts to load dev resources (HMR, etc).
  // Without this, Next 16 blocks cross-origin requests to /_next/* with a warning.
  allowedDevOrigins: [
    "192.168.1.140",
    "*.ngrok.app",
    "*.ngrok.io",
    "*.ngrok-free.app",
  ],
  images: {
    // Illustrations now live in the public Supabase Storage bucket (see
    // packages/content/assets.ts), so <Image> loads them cross-origin. /logo
    // stays a local asset.
    localPatterns: [{ pathname: "/logo/**" }],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ffoiltrarbdbibmymlqm.supabase.co",
        pathname: "/storage/v1/object/public/assets/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // The Apple App Site Association file is extensionless; iOS expects it
        // served as JSON over HTTPS with no redirect. Enables Universal Links
        // for the mobile app's Stripe donation return (/download/return).
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
  // Back-compat: the heavy assets moved to the Supabase CDN, but already-shipped
  // mobile builds (and old shared/email links) still request them from
  // plaindharma.com. Permanently redirect those legacy paths to the bucket so
  // nothing 404s and the bandwidth lands on the CDN, not Vercel. New web/mobile
  // code links the CDN directly via assetUrl, so these only fire for old URLs.
  async redirects() {
    const CDN =
      "https://ffoiltrarbdbibmymlqm.supabase.co/storage/v1/object/public/assets";
    return ["audio", "illustrations", "downloads"].map((dir) => ({
      source: `/${dir}/:path*`,
      destination: `${CDN}/${dir}/:path*`,
      permanent: true,
    }));
  },
};

export default withMDX(nextConfig);
