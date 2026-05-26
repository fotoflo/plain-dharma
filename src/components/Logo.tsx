import Link from "next/link";
import Image from "next/image";

import { getLogoUrl, getLogoDarkUrl } from "@/lib/logo-url";

// Full hand-finished lockup (watercolor disc + "Plain" / "Dharma" wordmark).
// Source art is transparent PNG; `size` controls the rendered height.
// A dark-mode variant ("Plain" re-tinted to cream) is swapped in under `.dark`.
export function Logo({ size = 36 }: { size?: number }) {
  // Natural art dimensions (740×180, ratio ≈ 4.111). We compute the rendered
  // width from `size` (height) so the <img> never relies on the browser
  // honoring `width: auto` inside a flex parent — which can squash it.
  const NATURAL_RATIO = 740 / 180;
  const width = Math.round(size * NATURAL_RATIO);
  const style = { height: size, width } as const;

  return (
    <Link
      href="/"
      aria-label="Plain Dharma — home"
      className="inline-flex shrink-0 items-center no-underline hover:no-underline"
    >
      <Image
        src={getLogoUrl()}
        alt="Plain Dharma"
        width={740}
        height={180}
        priority
        style={style}
        className="dark:hidden"
      />
      <Image
        src={getLogoDarkUrl()}
        alt="Plain Dharma"
        width={740}
        height={180}
        priority
        style={style}
        className="hidden dark:block"
      />
    </Link>
  );
}
