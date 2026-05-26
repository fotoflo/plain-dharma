import type { CSSProperties } from "react";

type WashSize = "sm" | "md" | "lg";
type WashPosition =
  | "top-left"
  | "top-right"
  | "top-center"
  | "center"
  | "bottom-left"
  | "bottom-right"
  | "bottom-center";

type WashProps = {
  size?: WashSize;
  position?: WashPosition;
  /** Opacity 0.08 – 0.15. Subtle is the rule — dial down if in doubt. */
  intensity?: number;
  className?: string;
};

const SIZE_PX: Record<WashSize, number> = {
  sm: 280,
  md: 480,
  lg: 760,
};

const BLUR_PX: Record<WashSize, number> = {
  sm: 28,
  md: 40,
  lg: 60,
};

function positionStyle(position: WashPosition, size: number): CSSProperties {
  // Offsets so the wash drifts off-edge for a "single warm presence in negative
  // space" feel — Penguin Classics lightbulb, not centered blob.
  const half = size / 2;
  const offEdge = -half * 0.35;

  switch (position) {
    case "top-left":
      return { top: offEdge, left: offEdge };
    case "top-right":
      return { top: offEdge, right: offEdge };
    case "top-center":
      return { top: offEdge, left: "50%", transform: "translateX(-50%)" };
    case "center":
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    case "bottom-left":
      return { bottom: offEdge, left: offEdge };
    case "bottom-right":
      return { bottom: offEdge, right: offEdge };
    case "bottom-center":
      return { bottom: offEdge, left: "50%", transform: "translateX(-50%)" };
  }
}

/**
 * A soft saffron watercolor wash for decorative background presence.
 *
 * Renders absolutely-positioned behind content with `pointer-events: none`
 * and `aria-hidden`. The parent must be `position: relative` (or absolute
 * itself) and have `overflow: hidden` if you want the wash clipped.
 *
 * Composition:
 *  - A radial gradient in saffron (#C7651C) with a heavy blur for the
 *    watercolor edge softness.
 *  - An inline SVG turbulence filter layered at very low opacity for
 *    "paper grain" texture without image assets.
 */
export function Wash({
  size = "md",
  position = "top-right",
  intensity = 0.12,
  className,
}: WashProps) {
  const sizePx = SIZE_PX[size];
  const blurPx = BLUR_PX[size];
  const clampedIntensity = Math.max(0.06, Math.min(0.18, intensity));

  const containerStyle: CSSProperties = {
    position: "absolute",
    width: sizePx,
    height: sizePx,
    pointerEvents: "none",
    zIndex: -1,
    ...positionStyle(position, sizePx),
  };

  const washStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at center, #C7651C 0%, rgba(199,101,28,0.6) 35%, transparent 70%)",
    filter: `blur(${blurPx}px)`,
    opacity: clampedIntensity,
    borderRadius: "50%",
  };

  // Grain overlay — inline SVG turbulence at very low opacity gives the
  // wash a subtle "paper" tooth without bringing in image assets.
  const grainSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.78  0 0 0 0 0.40  0 0 0 0 0.11  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
  const grainStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(grainSvg)}")`,
    backgroundRepeat: "repeat",
    opacity: 0.03,
    mixBlendMode: "multiply",
    borderRadius: "50%",
  };

  return (
    <div
      aria-hidden="true"
      className={className}
      style={containerStyle}
    >
      <div style={washStyle} />
      <div style={grainStyle} />
    </div>
  );
}
