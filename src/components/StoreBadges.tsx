import { APP_LINKS } from "@/lib/app-links";

/**
 * Official App Store + Google Play badges (Apple SVG / Google PNG, the only
 * formats each vendor ships), sized to a matched ~44px height per brand
 * guidelines. Each badge renders only when its store's `published` flag is
 * true — currently the App Store badge alone, with Google Play lighting up
 * when that listing is approved. Renders nothing if neither store is live,
 * so it can sit on any page safely.
 *
 * Plain <img> (not next/image): no point optimizing a vector badge, and it
 * sidesteps the images.localPatterns config.
 */
export function StoreBadges({ className = "" }: { className?: string }) {
  if (!APP_LINKS.iosPublished && !APP_LINKS.androidPublished) return null;
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-4 ${className}`}
    >
      {APP_LINKS.iosPublished && (
        <a href={APP_LINKS.ios} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/badges/app-store.svg"
            alt="Download on the App Store"
            height={44}
            className="h-11 w-auto"
          />
        </a>
      )}
      {APP_LINKS.androidPublished && (
        <a href={APP_LINKS.android} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/badges/google-play.png"
            alt="Get it on Google Play"
            height={44}
            className="h-11 w-auto"
          />
        </a>
      )}
    </div>
  );
}
