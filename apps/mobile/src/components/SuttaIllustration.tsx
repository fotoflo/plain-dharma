import { type SuttaSlug } from "@plain-dharma/content";
import { Image } from "expo-image";

import { SITE_ORIGIN } from "@/lib/site";
import { useTheme } from "@/theme/ThemeContext";

// Streams the transparent PNG illustration from the deployed site (expo-image
// caches to disk). Dark mode loads the `{slug}-dark.png` variant (the same
// CSS-swapped pair the web uses), so the art reads against the navy night sky
// instead of the cream paper.
export function SuttaIllustration({
  slug,
  size,
}: {
  slug: SuttaSlug;
  size: number;
}) {
  const { theme } = useTheme();
  const file = theme === "dark" ? `${slug}-dark` : slug;
  return (
    <Image
      source={`${SITE_ORIGIN}/illustrations/${file}.png`}
      style={{ width: size, height: size }}
      contentFit="contain"
      transition={200}
      alt=""
      accessibilityIgnoresInvertColors
    />
  );
}
