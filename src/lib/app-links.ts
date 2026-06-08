// Single source of truth for the mobile-app store listings.
//
// The URLs can ship before the apps are approved — they resolve to a store
// "not found" page until the listings go live, then activate automatically.
// `published` gates the *visible* download badges (see /download); the
// structured-data MobileApplication node ships regardless (harmless to point
// at a pending listing, and it's discovered the moment the listing flips live).
//
// iOS App Store ID and the shared bundle/package id come from apps/mobile
// (eas.json `ascAppId`, app.json `bundleIdentifier`/`package` = com.plaindharma.app).

export const APP_LINKS = {
  ios: "https://apps.apple.com/app/id6774981366",
  android:
    "https://play.google.com/store/apps/details?id=com.plaindharma.app",
  /**
   * Public TestFlight link for the external "friends and fam" group. Lets
   * people install the iPhone beta *before* App Store approval — surfaced on
   * the home page while `published` is still false. (Set in App Store Connect →
   * TestFlight → group → Enable Public Link.)
   */
  testflight: "https://testflight.apple.com/join/yHg7PdwM",
  /** Flip to `true` on store approval to reveal the download badges. */
  published: false,
} as const;
