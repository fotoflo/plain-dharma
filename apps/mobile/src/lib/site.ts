// The deployed site the mobile app talks to for APIs (Stripe checkout, newsletter)
// and download/return deep-links. Override in dev to point at a local/ngrok
// server so Stripe runs in TEST mode (the prod site uses live keys), e.g.
//   EXPO_PUBLIC_SITE_ORIGIN=http://localhost:8008          # iOS simulator → host Mac
//   EXPO_PUBLIC_SITE_ORIGIN=https://<id>.ngrok-free.app    # physical device
// EXPO_PUBLIC_* is inlined at bundle time, so restart Metro after changing it.
// Heavy assets (audio/illustrations) always come from the Supabase CDN, not here.
export const SITE_ORIGIN =
  process.env.EXPO_PUBLIC_SITE_ORIGIN ?? "https://plaindharma.com";
