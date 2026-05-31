/**
 * Auth + Margin Notes sync provider for mobile.
 *
 * Combines what the web splits across `src/lib/supabase.ts` and
 * `useMarginalia.ts`, adapted to RN's deep-link magic-link flow:
 *
 *  - `signInWithEmail(email)` sends a Supabase magic link whose `emailRedirectTo`
 *    is a `mobile://` deep link built with expo-linking `createURL`.
 *  - When the user taps the link, the OS hands the URL back to the app. We parse
 *    the implicit-flow tokens (which arrive in the URL *fragment*,
 *    `#access_token=…&refresh_token=…`) and call `supabase.auth.setSession`.
 *    expo-linking's `parse` only reads query params, so we parse the fragment by
 *    hand.
 *  - On a live session we run the same local↔remote merge the web does and
 *    write-through every change.
 *
 * Local-first: marks render from AsyncStorage immediately; sync layers on once
 * signed in. If Supabase env is absent, the whole thing degrades to local-only.
 */

import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { getSupabase, isSyncConfigured } from "@/lib/supabase";

import {
  deleteRemote,
  getMarks,
  getMarksSnapshot,
  insertRemote,
  loadMarksOnce,
  setMarks,
  subscribeMarks,
  syncOnSignIn,
  updateRemoteNote,
} from "./store";
import type { MarginMark } from "./types";

/** Deep link the magic link returns to. Built once from the app scheme. */
export const AUTH_REDIRECT_URL = Linking.createURL("auth/callback");

type AuthContextValue = {
  marks: MarginMark[];
  signedIn: boolean;
  email: string | null;
  syncAvailable: boolean;
  add: (mark: MarginMark) => void;
  updateNote: (id: string, note: string | null) => void;
  remove: (id: string) => void;
  signInWithEmail: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Parse implicit-flow auth tokens from a returned deep link's fragment/query. */
function tokensFromUrl(
  url: string,
): { access_token: string; refresh_token: string } | null {
  // Tokens normally come back in the fragment (#access_token=…). Fall back to
  // the query string in case a provider returns them there.
  const hashIndex = url.indexOf("#");
  const fragment = hashIndex >= 0 ? url.slice(hashIndex + 1) : "";
  const params = new URLSearchParams(fragment);

  let access = params.get("access_token");
  let refresh = params.get("refresh_token");

  if (!access || !refresh) {
    const parsed = Linking.parse(url);
    const q = parsed.queryParams ?? {};
    const pick = (v: string | string[] | undefined) =>
      Array.isArray(v) ? v[0] : v;
    access = access ?? pick(q.access_token) ?? null;
    refresh = refresh ?? pick(q.refresh_token) ?? null;
  }

  if (access && refresh) return { access_token: access, refresh_token: refresh };
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const marks = useSyncExternalStore(subscribeMarks, getMarksSnapshot, getMarksSnapshot);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const syncedRef = useRef(false);
  const incomingUrl = Linking.useURL();

  // Apply a session to local state and run the one-time merge on sign-in.
  const onSession = useCallback(async (session: Session | null) => {
    const uid = session?.user.id ?? null;
    setUserId(uid);
    setEmail(session?.user.email ?? null);
    if (uid && !syncedRef.current) {
      syncedRef.current = true;
      const sb = getSupabase();
      if (sb) {
        const merged = await syncOnSignIn(sb, uid, getMarks());
        setMarks(merged);
      }
    }
    if (!uid) syncedRef.current = false;
  }, []);

  // Load local marks + restore any persisted session, and subscribe to changes.
  useEffect(() => {
    loadMarksOnce();
    const sb = getSupabase();
    if (!sb) return;

    let cancelled = false;
    sb.auth.getSession().then(({ data }) => {
      if (!cancelled) onSession(data.session);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      if (!cancelled) onSession(session);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [onSession]);

  // Handle the magic-link deep link: extract tokens and set the session.
  useEffect(() => {
    if (!incomingUrl || !incomingUrl.includes("auth/callback")) return;
    const sb = getSupabase();
    if (!sb) return;
    const tokens = tokensFromUrl(incomingUrl);
    if (tokens) {
      sb.auth.setSession(tokens).catch(() => {});
    }
  }, [incomingUrl]);

  const add = useCallback(
    (mark: MarginMark) => {
      setMarks([...getMarks(), mark]);
      const sb = getSupabase();
      if (sb && userId) {
        insertRemote(sb, userId, mark).then((ok) => {
          if (ok) {
            setMarks(getMarks().map((m) => (m.id === mark.id ? { ...m, synced: true } : m)));
          }
        });
      }
    },
    [userId],
  );

  const updateNote = useCallback(
    (id: string, note: string | null) => {
      setMarks(getMarks().map((m) => (m.id === id ? { ...m, note } : m)));
      const sb = getSupabase();
      if (sb && userId) updateRemoteNote(sb, id, note);
    },
    [userId],
  );

  const remove = useCallback(
    (id: string) => {
      setMarks(getMarks().filter((m) => m.id !== id));
      const sb = getSupabase();
      if (sb && userId) deleteRemote(sb, id);
    },
    [userId],
  );

  const signInWithEmail = useCallback(async (mail: string) => {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: "Sync isn’t available right now." };
    const { error } = await sb.auth.signInWithOtp({
      email: mail,
      options: { emailRedirectTo: AUTH_REDIRECT_URL },
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    syncedRef.current = false;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      marks,
      signedIn: userId != null,
      email,
      syncAvailable: isSyncConfigured(),
      add,
      updateNote,
      remove,
      signInWithEmail,
      signOut,
    }),
    [marks, userId, email, add, updateNote, remove, signInWithEmail, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useMarginalia(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useMarginalia must be used within an AuthProvider");
  return ctx;
}
