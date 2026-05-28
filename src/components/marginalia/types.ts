/** Shared types for Margin Notes (highlights + private notes). */

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
