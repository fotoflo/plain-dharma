/**
 * Auto-fires a GA4 `screen_view` whenever the expo-router pathname changes.
 *
 * Mounted once in the root layout. Uses `usePathname` (re-renders on every
 * navigation) and de-dupes consecutive identical paths so a re-render with the
 * same route doesn't double-count. The first render also fires (initial screen).
 */

import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";

import { logScreenView } from "./analytics";

export function useScreenTracking(): void {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === last.current) return;
    last.current = pathname;
    // Normalize "/" to a readable name; otherwise use the path as the screen.
    logScreenView(pathname === "/" ? "home" : pathname);
  }, [pathname]);
}
