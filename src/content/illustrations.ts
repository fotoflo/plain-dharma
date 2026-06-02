import { assetUrl, hasAsset } from "@plain-dharma/content/assets";

import type { SuttaSlug } from "./index";

/**
 * Returns the CDN URL for the illustration, e.g.
 * `https://…/storage/v1/object/public/assets/illustrations/first-talk.png?v=a1b2c3d4`.
 * The `?v=` is a content hash from the asset version map, so a regenerated PNG
 * (re-uploaded) busts browser cache automatically. The PNGs live in the public
 * Supabase bucket, not the repo — safe to call from anywhere (no fs).
 */
export function getIllustrationUrl(slug: SuttaSlug): string {
  return assetUrl(`illustrations/${slug}.png`);
}

/**
 * Dark-mode variant (`<slug>-dark.png`): same art with the ink line-work
 * re-tinted to warm cream so it reads on the navy night-sky background.
 * Falls back to the light URL when no dark variant has been uploaded.
 */
export function getIllustrationDarkUrl(slug: SuttaSlug): string {
  return hasAsset(`illustrations/${slug}-dark.png`)
    ? assetUrl(`illustrations/${slug}-dark.png`)
    : getIllustrationUrl(slug);
}
