import Link from "next/link";
import Image from "next/image";

// Full hand-finished lockup (watercolor disc + "Plain" / "Dharma" wordmark).
// Source art is transparent PNG; `size` controls the rendered height.
// A dark-mode variant ("Plain" re-tinted to cream) is swapped in under `.dark`.
export function Logo({ size = 36 }: { size?: number }) {
  // Natural art dimensions (738×176, ratio ≈ 4.193). We compute the rendered
  // width from `size` (height) so the <img> never relies on the browser
  // honoring `width: auto` inside a flex parent — which can squash it.
  const NATURAL_RATIO = 738 / 176;
  const width = Math.round(size * NATURAL_RATIO);
  const style = { height: size, width } as const;

  return (
    <Link
      href="/"
      aria-label="Plain Dharma — home"
      className="inline-flex shrink-0 items-center no-underline hover:no-underline"
    >
      <Image
        src="/logo/plain-dharma-logo.png"
        alt="Plain Dharma"
        width={738}
        height={176}
        priority
        style={style}
        className="dark:hidden"
      />
      <Image
        src="/logo/plain-dharma-logo-dark.png"
        alt="Plain Dharma"
        width={738}
        height={176}
        priority
        style={style}
        className="hidden dark:block"
      />
    </Link>
  );
}
