/**
 * Margin Notes data layer for mobile — pure functions + a small reactive store,
 * no React. Mirrors the web's `src/components/marginalia/store.ts`:
 *
 *  - Local-first: marks live in AsyncStorage and paint instantly while signed
 *    out. A magic-link sign-in fetches the reader's server marks, merges them,
 *    and pushes any local-only marks up.
 *  - Ids are client-generated UUIDs reused as the server primary key, so one id
 *    identifies a mark in memory, on disk, and in Supabase (no re-keying).
 *  - Reads/writes the SAME `public.marginalia` table + columns as the web, so a
 *    reader's notes sync across both surfaces.
 *
 * Difference from web: AsyncStorage is async, so persistence is fire-and-forget
 * and `loadMarksOnce` resolves asynchronously (the store emits when ready).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { MarginMark, MarginRow } from "./types";

// Distinct key from the web's localStorage "pd-margin-notes" — they live in
// different stores anyway, and the server is the cross-device source of truth.
const LS_KEY = "pd-margin-notes";
const COLS = "id,slug,locale,anchor,quote,prefix,suffix,note,color,created_at,updated_at";

/** RFC4122-ish v4 uuid without a crypto dependency (avoids a native polyfill). */
export function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function newMark(
  input: Omit<MarginMark, "id" | "created_at" | "synced">,
): MarginMark {
  return { ...input, id: uuid(), created_at: new Date().toISOString(), synced: false };
}

// A passage + its note content — used to skip re-pushing marks already upstream.
function dupKey(m: Pick<MarginMark, "slug" | "anchor" | "quote" | "note">): string {
  return [m.slug, m.anchor, m.quote, m.note ?? ""].join(" ");
}

function rowToMark(r: MarginRow): MarginMark {
  return { ...r, synced: true };
}

function markToRow(m: MarginMark, userId: string) {
  return {
    id: m.id,
    user_id: userId,
    slug: m.slug,
    locale: m.locale,
    anchor: m.anchor,
    quote: m.quote,
    prefix: m.prefix,
    suffix: m.suffix,
    note: m.note,
    color: m.color,
  };
}

export async function fetchRemote(sb: SupabaseClient): Promise<MarginMark[]> {
  const { data, error } = await sb.from("marginalia").select(COLS);
  if (error || !data) return [];
  return (data as MarginRow[]).map(rowToMark);
}

export async function insertRemote(
  sb: SupabaseClient,
  userId: string,
  m: MarginMark,
): Promise<boolean> {
  const { error } = await sb.from("marginalia").insert(markToRow(m, userId));
  return !error;
}

export async function updateRemoteNote(
  sb: SupabaseClient,
  id: string,
  note: string | null,
): Promise<boolean> {
  const { error } = await sb.from("marginalia").update({ note }).eq("id", id);
  return !error;
}

/** Update an arbitrary subset of a mark's editable columns (note, color). */
export async function updateRemoteFields(
  sb: SupabaseClient,
  id: string,
  fields: Partial<Pick<MarginMark, "note" | "color">>,
): Promise<boolean> {
  const { error } = await sb.from("marginalia").update(fields).eq("id", id);
  return !error;
}

export async function deleteRemote(sb: SupabaseClient, id: string): Promise<boolean> {
  const { error } = await sb.from("marginalia").delete().eq("id", id);
  return !error;
}

/**
 * Merge server marks with local ones (server wins on id collisions) and push
 * any local-only marks up. Returns the merged set with sync flags resolved.
 */
export async function syncOnSignIn(
  sb: SupabaseClient,
  userId: string,
  local: MarginMark[],
): Promise<MarginMark[]> {
  const remote = await fetchRemote(sb);
  const remoteById = new Map(remote.map((m) => [m.id, m]));
  const remoteDup = new Set(remote.map(dupKey));

  const toPush = local.filter((m) => !remoteById.has(m.id) && !remoteDup.has(dupKey(m)));
  for (const m of toPush) {
    const ok = await insertRemote(sb, userId, m);
    if (ok) m.synced = true;
  }

  const merged = new Map<string, MarginMark>();
  for (const m of remote) merged.set(m.id, m);
  for (const m of toPush) merged.set(m.id, m);
  return [...merged.values()];
}

/* ── Reactive store ────────────────────────────────────────────────────────
   A module-level store read via useSyncExternalStore — same idiom as the web
   and as the app's other persisted state. AsyncStorage writes are
   fire-and-forget. ──────────────────────────────────────────────────────── */

type Listener = () => void;
const EMPTY: MarginMark[] = [];
let current: MarginMark[] = EMPTY;
let loaded = false;
let loadingPromise: Promise<void> | null = null;
const listeners = new Set<Listener>();

function emit(): void {
  for (const l of listeners) l();
}

export function subscribeMarks(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function getMarksSnapshot(): MarginMark[] {
  return current;
}

export function getMarks(): MarginMark[] {
  return current;
}

/** Read AsyncStorage once. Idempotent; resolves when the store is populated. */
export function loadMarksOnce(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(LS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed) && parsed.length) {
        current = parsed as MarginMark[];
        emit();
      }
    } catch {
      /* corrupt/unavailable — start empty */
    } finally {
      loaded = true;
    }
  })();
  return loadingPromise;
}

/** Replace the marks, persist (fire-and-forget), and notify subscribers. */
export function setMarks(next: MarginMark[]): void {
  current = next;
  AsyncStorage.setItem(LS_KEY, JSON.stringify(next)).catch(() => {});
  emit();
}
