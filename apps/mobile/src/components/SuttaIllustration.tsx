import { type SuttaSlug } from "@plain-dharma/content";
import { assetUrl } from "@plain-dharma/content/assets";
import { Image } from "expo-image";

import { useTheme } from "@/theme/ThemeContext";

// Streams the transparent PNG illustration from the public Supabase CDN
// (expo-image caches to disk). Dark mode loads the `{slug}-dark.png` variant
// (the same pair the web uses), so the art reads against the navy night sky
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
      source={assetUrl(`illustrations/${file}.png`)}
      style={{ width: size, height: size }}
      contentFit="contain"
      transition={200}
      alt=""
      accessibilityIgnoresInvertColors
    />
  );
}
