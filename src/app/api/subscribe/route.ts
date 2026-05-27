/**
 * Newsletter subscription endpoint. Adds an email to the configured Mailjet
 * contact list via the Mailjet REST API.
 *
 * Required env:
 *   MAILJET_API_KEY_PUBLIC   — from https://app.mailjet.com/account/apikeys
 *   MAILJET_SECRET_KEY       — same page
 *   MAILJET_CONTACT_LIST_ID  — numeric ID of the list (Mailjet Dashboard →
 *                              Contacts → Lists → "...". The URL contains the ID.)
 *
 * Action="addnoforce" means: add the contact if absent, no-op if already on
 * the list. So a resubmit just succeeds silently — friendlier than erroring.
 */

import { NextResponse } from "next/server";

// Defensive bounds — short enough to fit a real email, long enough for edge
// cases (e.g. corporate addresses with long local parts).
const MIN_EMAIL_LEN = 3;
const MAX_EMAIL_LEN = 254; // RFC-permitted maximum

// Conservative shape check. We rely on Mailjet's own validation as the source
// of truth for deliverability — this is just a fast client-friendly filter.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const publicKey = process.env.MAILJET_API_KEY_PUBLIC;
  const secretKey = process.env.MAILJET_SECRET_KEY;
  const listId = process.env.MAILJET_CONTACT_LIST_ID;

  if (!publicKey || !secretKey || !listId) {
    return NextResponse.json(
      { error: "Newsletter is not yet configured." },
      { status: 503 }
    );
  }

  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const raw = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (
    raw.length < MIN_EMAIL_LEN ||
    raw.length > MAX_EMAIL_LEN ||
    !EMAIL_REGEX.test(raw)
  ) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  // Basic auth: base64("public:secret"). Don't echo this anywhere.
  const auth = Buffer.from(`${publicKey}:${secretKey}`).toString("base64");

  try {
    const res = await fetch(
      `https://api.mailjet.com/v3/REST/contactslist/${listId}/managecontact`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Email: raw,
          Action: "addnoforce",
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      // Mailjet sometimes returns 304 for already-subscribed contacts —
      // that's a success from the user's perspective.
      if (res.status === 304) {
        return NextResponse.json({ ok: true, alreadySubscribed: true });
      }
      console.error("[subscribe] Mailjet error", res.status, text);
      return NextResponse.json(
        { error: "We couldn't add you to the list. Try again in a minute?" },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[subscribe] network error", err);
    return NextResponse.json(
      { error: "Network error. Please try again." },
      { status: 502 }
    );
  }
}
