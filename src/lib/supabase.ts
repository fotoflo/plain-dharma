import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;

/**
 * Browser-only Supabase client for Margin Notes.
 *
 * Implicit auth flow: the magic-link callback is handled entirely client-side
 * (token arrives in the URL hash and `detectSessionInUrl` picks it up), so there
 * is no `/auth/callback` route and the site stays static-export compatible.
 *
 * Lazily constructed and browser-guarded so importing this module from a module
 * that also runs during server render never touches `window`. Returns null when
 * the public env vars are absent (e.g. a preview deploy without them) — callers
 * treat that as "sync unavailable" and fall back to localStorage.
 */
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (typeof window === "undefined" || !URL || !KEY) return null;
  client = createClient(URL, KEY, {
    auth: {
      flowType: "implicit",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return client;
}
