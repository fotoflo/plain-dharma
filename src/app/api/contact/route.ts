/**
 * Contact form endpoint for the /contribute page. Sends the submitted message
 * to the project owner via the Resend REST API.
 *
 * This is a server-side carve-out for the same reason as /api/subscribe and
 * /api/checkout: the Resend key must never reach the browser.
 *
 * Required env:
 *   RESEND_API_KEY      — from https://resend.com/api-keys
 * Optional env (sensible defaults so the form works out of the box):
 *   CONTACT_TO_EMAIL    — where messages land (default: fotoflo@gmail.com)
 *   CONTACT_FROM_EMAIL  — verified sender. Defaults to Resend's shared
 *                         onboarding@resend.dev, which can only deliver to the
 *                         account owner's address — fine here, since the
 *                         recipient IS the owner. Switch to a verified-domain
 *                         address (e.g. "Plain Dharma <hello@plaindharma.com>")
 *                         once the domain is verified in Resend.
 */

import { NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LEN = 254; // RFC-permitted maximum
const MAX_NAME_LEN = 200;
const MIN_MESSAGE_LEN = 2;
const MAX_MESSAGE_LEN = 5000;

const DEFAULT_TO = "fotoflo@gmail.com";
const DEFAULT_FROM = "Plain Dharma <onboarding@resend.dev>";

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Contact form is not yet configured." },
      { status: 503 }
    );
  }

  let body: { name?: unknown; email?: unknown; message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name =
    typeof body.name === "string" ? body.name.trim().slice(0, MAX_NAME_LEN) : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (email.length > MAX_EMAIL_LEN || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }
  if (message.length < MIN_MESSAGE_LEN || message.length > MAX_MESSAGE_LEN) {
    return NextResponse.json(
      { error: "Please include a short message." },
      { status: 400 }
    );
  }

  const to = process.env.CONTACT_TO_EMAIL ?? DEFAULT_TO;
  const from = process.env.CONTACT_FROM_EMAIL ?? DEFAULT_FROM;
  const who = name ? `${name} <${email}>` : email;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Plain Dharma — message from ${name || email}`,
        text: `From: ${who}\n\n${message}`,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[contact] Resend error", res.status, detail);
      return NextResponse.json(
        { error: "We couldn't send your message. Try again in a minute?" },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] network error", err);
    return NextResponse.json(
      { error: "Network error. Please try again." },
      { status: 502 }
    );
  }
}
