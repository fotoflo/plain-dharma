import { SITE_ORIGIN } from "./site";

export type SubscribeResult =
  | { ok: true; alreadySubscribed: boolean }
  | { ok: false; error: string };

// Calls the deployed /api/subscribe route (Resend-backed). No new backend.
export async function subscribe(email: string): Promise<SubscribeResult> {
  try {
    const res = await fetch(`${SITE_ORIGIN}/api/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data: { error?: string; alreadySubscribed?: boolean } = await res
      .json()
      .catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error ?? `Request failed (HTTP ${res.status})` };
    }
    return { ok: true, alreadySubscribed: Boolean(data.alreadySubscribed) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
