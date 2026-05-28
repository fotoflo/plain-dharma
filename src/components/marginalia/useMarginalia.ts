"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getSupabase } from "@/lib/supabase";
import type { MarginMark } from "./types";
import {
  deleteRemote,
  getMarks,
  getMarksSnapshot,
  getServerMarksSnapshot,
  insertRemote,
  loadMarksOnce,
  setMarks,
  subscribeMarks,
  syncOnSignIn,
  updateRemoteNote,
} from "./store";

interface UseMarginalia {
  marks: MarginMark[];
  signedIn: boolean;
  email: string | null;
  add: (mark: MarginMark) => void;
  updateNote: (id: string, note: string | null) => void;
  remove: (id: string) => void;
  signIn: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

/**
 * Local-first margin-notes state. Marks live in a module store backed by
 * localStorage and render immediately; when a session is present (magic-link
 * sign-in) they sync with Supabase and every change write-throughs to the
 * server. Server failures are non-fatal — the mark stays local (synced=false)
 * and a later sign-in retries.
 */
export function useMarginalia(): UseMarginalia {
  const marks = useSyncExternalStore(subscribeMarks, getMarksSnapshot, getServerMarksSnapshot);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const syncedRef = useRef(false);

  useEffect(() => {
    loadMarksOnce();

    const sb = getSupabase();
    if (!sb) return;

    let cancelled = false;

    const onSession = async (uid: string | null, mail: string | null) => {
      if (cancelled) return;
      setUserId(uid);
      setEmail(mail);
      if (uid && !syncedRef.current) {
        syncedRef.current = true;
        const merged = await syncOnSignIn(sb, uid, getMarks());
        if (!cancelled) setMarks(merged);
      }
      if (!uid) syncedRef.current = false;
    };

    sb.auth.getSession().then(({ data }) => {
      onSession(data.session?.user.id ?? null, data.session?.user.email ?? null);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      onSession(session?.user.id ?? null, session?.user.email ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const add = useCallback(
    (mark: MarginMark) => {
      setMarks([...getMarks(), mark]);
      const sb = getSupabase();
      if (sb && userId) {
        insertRemote(sb, userId, mark).then((ok) => {
          if (ok) setMarks(getMarks().map((m) => (m.id === mark.id ? { ...m, synced: true } : m)));
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

  const signIn = useCallback(async (mail: string) => {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: "Sync isn’t available right now." };
    const { error } = await sb.auth.signInWithOtp({
      email: mail,
      options: { emailRedirectTo: window.location.href },
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    syncedRef.current = false;
  }, []);

  return { marks, signedIn: userId != null, email, add, updateNote, remove, signIn, signOut };
}
