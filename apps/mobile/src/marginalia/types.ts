/**
 * Shared types for Margin Notes (highlights + private notes).
 *
 * Duplicated from the web's `src/components/marginalia/types.ts` — kept byte
 * compatible so the SAME `public.marginalia` Supabase table round-trips between
 * web and mobile. (The web file is tiny and has no RN-incompatible imports, but
 * it lives in the Next app graph, not a shared package, so we mirror it here.)
 */

/** One mark. `note === null` → a plain highlight; a string → a private note. */
export interface MarginMark {
  id: string;
  slug: string;
  locale: string;
  anchor: string;
  quote: string;
  prefix: string;
  suffix: string;
  note: string | null;
  color: string;
  created_at: string;
  updated_at?: string;
  /** Client-only: true once this mark exists on the server (synced). */
  synced?: boolean;
}

/** The shape stored in Supabase (snake_case columns, no client-only fields). */
export interface MarginRow {
  id: string;
  slug: string;
  locale: string;
  anchor: string;
  quote: string;
  prefix: string;
  suffix: string;
  note: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}
