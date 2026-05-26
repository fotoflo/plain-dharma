import { statSync } from "node:fs";
import path from "node:path";

import type { SuttaSlug } from "./index";

/**
 * Returns a versioned URL for the illustration, e.g. `/illustrations/first-talk.png?v=1716662812`.
 * The version is the file mtime in seconds. When the PNG changes, the URL changes,
 * busting browser cache automatically. Safe to call from Server Components only.
 */
export function getIllustrationUrl(slug: SuttaSlug): string {
  const filePath = path.join(
    process.cwd(),
    "public",
    "illustrations",
    `${slug}.png`
  );
  try {
    const mtime = statSync(filePath).mtimeMs;
    return `/illustrations/${slug}.png?v=${Math.floor(mtime / 1000)}`;
  } catch {
    // File missing — return unversioned path; next/image will 404 gracefully
    return `/illustrations/${slug}.png`;
  }
}

/**
 * Dark-mode variant (`<slug>-dark.png`): same art with the ink line-work
 * re-tinted to warm cream so it reads on the navy night-sky background.
 * Falls back to the light URL if the dark file is missing.
 */
export function getIllustrationDarkUrl(slug: SuttaSlug): string {
  const filePath = path.join(
    process.cwd(),
    "public",
    "illustrations",
    `${slug}-dark.png`
  );
  try {
    const mtime = statSync(filePath).mtimeMs;
    return `/illustrations/${slug}-dark.png?v=${Math.floor(mtime / 1000)}`;
  } catch {
    return getIllustrationUrl(slug);
  }
}
