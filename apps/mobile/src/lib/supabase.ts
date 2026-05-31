/**
 * React Native Supabase client for Margin Notes (highlights + private notes).
 *
 * Mirrors the web's `src/lib/supabase.ts` but RN-appropriate:
 *  - AsyncStorage as the auth session store (RN has no localStorage).
 *  - `detectSessionInUrl: false` — RN has no URL bar; the magic-link deep link
 *    is handled by hand in AuthContext (we parse the tokens off the returned
 *    `mobile://` URL and call `setSession`).
 *  - `persistSession` + `autoRefreshToken` so the reader stays signed in.
 *
 * Reads/writes the SAME `public.marginalia` table the web uses, so notes sync
 * across web and mobile for a given signed-in reader.
 *
 * Env (pushed via EAS / app config — publishable key is safe to ship):
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * Falls back to expo-constants `extra.supabase.*`. Returns null when absent —
 * callers treat that as "sync unavailable" and fall back to local storage only.
 */

// Polyfills URL/URLSearchParams that supabase-js relies on. Must load first.
import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

type SupabaseExtra = { url?: string; publishableKey?: string };

const extra = (Constants.expoConfig?.extra?.supabase ?? {}) as SupabaseExtra;

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.url ?? "";
const KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? extra.publishableKey ?? "";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (!URL || !KEY) return null;
  client = createClient(URL, KEY, {
    auth: {
      storage: AsyncStorage,
      flowType: "implicit",
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return client;
}

/** Whether sync is even possible (env present). UI uses this to gate features. */
export function isSyncConfigured(): boolean {
  return Boolean(URL && KEY);
}
