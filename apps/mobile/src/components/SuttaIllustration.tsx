import { type SuttaSlug } from "@plain-dharma/content";
import { Image } from "expo-image";

import { SITE_ORIGIN } from "@/lib/site";

// Streams the transparent PNG illustration from the deployed site (expo-image
// caches to disk). The base PNG is alpha-faded to read on both light and dark,
// so we don't need the web's separate dark variant for v1.
export function SuttaIllustration({
  slug,
  size,
}: {
  slug: SuttaSlug;
  size: number;
}) {
  return (
    <Image
      source={`${SITE_ORIGIN}/illustrations/${slug}.png`}
      style={{ width: size, height: size }}
      contentFit="contain"
      transition={200}
      accessibilityIgnoresInvertColors
    />
  );
}
