// Single source of truth for the mobile-app store listings.
//
// Each store has its own `published` flag because the listings go live
// independently — iOS shipped 2026-06 (v1.0, ASC app 6774981366); the Google
// Play listing is still pending. A badge renders only when its store's flag
// is true (see StoreBadges). The structured-data MobileApplication node ships
// regardless (harmless to point at a pending listing, and it's discovered the
// moment the listing flips live).
//
// iOS App Store ID and the shared bundle/package id come from apps/mobile
// (eas.json `ascAppId`, app.json `bundleIdentifier`/`package` = com.plaindharma.app).

export const APP_LINKS = {
  ios: "https://apps.apple.com/app/id6774981366",
  android:
    "https://play.google.com/store/apps/details?id=com.plaindharma.app",
  /**
   * Public TestFlight link for the external "friends and fam" group. Kept as
   * a fallback CTA for surfaces that render before any store is live.
   */
  testflight: "https://testflight.apple.com/join/yHg7PdwM",
  /** Live on the App Store since 2026-06-12. */
  iosPublished: true,
  /** Flip to `true` when the Google Play listing is approved. */
  androidPublished: false,
} as const;

/** True once at least one store listing is live — gates the app panels. */
export const APP_PUBLISHED =
  APP_LINKS.iosPublished || APP_LINKS.androidPublished;
