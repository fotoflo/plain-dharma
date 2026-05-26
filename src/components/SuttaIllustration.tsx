import Image from "next/image";
import type { SuttaSlug } from "@/content";
import {
  getIllustrationUrl,
  getIllustrationDarkUrl,
} from "@/content/illustrations";

// Renders the light + dark illustration variants and toggles between them by
// theme via the `.dark` class (CSS only, so it works in a Server Component).
type Props = {
  slug: SuttaSlug;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export function SuttaIllustration({
  slug,
  alt,
  width,
  height,
  className = "",
  priority,
  sizes,
}: Props) {
  const common = { width, height, priority, sizes } as const;
  return (
    <>
      <Image
        src={getIllustrationUrl(slug)}
        alt={alt}
        {...common}
        className={`${className} dark:hidden`}
      />
      <Image
        src={getIllustrationDarkUrl(slug)}
        alt=""
        aria-hidden="true"
        {...common}
        className={`${className} hidden dark:block`}
      />
    </>
  );
}
