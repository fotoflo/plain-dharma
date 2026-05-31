/**
 * Google Analytics 4 via the Measurement Protocol (pure JS, no native module).
 *
 * RN can't use gtag.js (no DOM) and we deliberately avoid the Firebase native
 * SDK (it would force an App Store rebuild and break OTA). Instead we POST
 * events straight to GA4's collect endpoint over `fetch`, keyed by a persistent
 * per-install `client_id`.
 *
 * Configuration comes from env (never hardcode the api_secret):
 *   EXPO_PUBLIC_GA_MEASUREMENT_ID  — e.g. "G-XXXXXXXXXX" (mobile data stream)
 *   EXPO_PUBLIC_GA_API_SECRET      — Measurement Protocol API secret for that stream
 * Read first from those env vars, falling back to expo-constants `extra.ga.*`.
 * If either is missing, every call is a graceful no-op.
 *
 * Gated to production: in __DEV__ we never send (so dev navigation doesn't
 * pollute the property).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const CLIENT_ID_KEY = "pd-ga-client-id";

type GaExtra = { measurementId?: string; apiSecret?: string };

const extra = (Constants.expoConfig?.extra?.ga ?? {}) as GaExtra;

const MEASUREMENT_ID =
  process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID ?? extra.measurementId ?? "";
const API_SECRET =
  process.env.EXPO_PUBLIC_GA_API_SECRET ?? extra.apiSecret ?? "";

const ENABLED = !__DEV__ && Boolean(MEASUREMENT_ID) && Boolean(API_SECRET);

const ENDPOINT = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(
  MEASUREMENT_ID,
)}&api_secret=${encodeURIComponent(API_SECRET)}`;

let clientIdPromise: Promise<string> | null = null;

function randomId(): string {
  // GA's web client_id shape is "<rand>.<timestamp>"; any stable string works.
  const rand = Math.floor(Math.random() * 1e10).toString();
  return `${rand}.${Math.floor(Date.now() / 1000)}`;
}

/** A stable per-install client id, persisted to AsyncStorage. */
function getClientId(): Promise<string> {
  if (clientIdPromise) return clientIdPromise;
  clientIdPromise = (async () => {
    try {
      const existing = await AsyncStorage.getItem(CLIENT_ID_KEY);
      if (existing) return existing;
      const fresh = randomId();
      await AsyncStorage.setItem(CLIENT_ID_KEY, fresh);
      return fresh;
    } catch {
      // Storage unavailable — use an ephemeral id so the session still tracks.
      return randomId();
    }
  })();
  return clientIdPromise;
}

/** Fire a single GA4 event. No-op when analytics is disabled/unconfigured. */
export async function logEvent(
  name: string,
  params: Record<string, string | number | boolean> = {},
): Promise<void> {
  if (!ENABLED) return;
  try {
    const clientId = await getClientId();
    await fetch(ENDPOINT, {
      method: "POST",
      // No headers needed; GA's collect endpoint accepts a bare JSON body.
      body: JSON.stringify({
        client_id: clientId,
        events: [
          {
            name,
            params: {
              // Marks this as an app/engaged event so realtime + reports see it.
              engagement_time_msec: 1,
              ...params,
            },
          },
        ],
      }),
    });
  } catch {
    // Analytics must never throw into the app.
  }
}

/**
 * Log a screen view. GA4 uses the reserved `screen_view` event with a
 * `screen_name` param for app streams (the analog of web `page_view`).
 */
export function logScreenView(screenName: string): Promise<void> {
  return logEvent("screen_view", { screen_name: screenName });
}
