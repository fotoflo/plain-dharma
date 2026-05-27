/**
 * Stripe Checkout Session creator for the donation flow.
 *
 * This is the ONE server-side carve-out in an otherwise static site. The
 * `/download/donate` page POSTs { amount, file } here; we create a Checkout
 * Session and return its URL for the browser to redirect to. After payment,
 * Stripe redirects to `/download/thank-you?file=<slug>` which auto-triggers
 * the file download.
 *
 * Amount is validated server-side — never trust the client number, even
 * though Stripe also has its own minimums.
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";

// Stripe minimum charge for USD is 50¢. We enforce $1 as a friendlier floor —
// anything under really means "free," and the user can take the free path.
const MIN_CENTS = 100;
// Sanity cap to prevent typo donations of $999,999. Adjust if a true patron
// wants to give more (they can do it through KDP / Buy Me a Coffee).
const MAX_CENTS = 50_000; // $500

const VALID_FILES = ["epub", "pdf", "m4b"] as const;
type FileSlug = (typeof VALID_FILES)[number];

const PRODUCT_DESCRIPTION: Record<FileSlug, string> = {
  epub: "Plain Dharma — EPUB edition (six foundational Buddhist suttas in plain modern English)",
  pdf:  "Plain Dharma — PDF edition (six foundational Buddhist suttas in plain modern English)",
  m4b:  "Plain Dharma — narrated audiobook edition (six foundational Buddhist suttas in plain modern English)",
};

function getBaseUrl(req: Request): string {
  // Prefer the request's own origin so preview deployments and localhost work
  // without env-var juggling. Fall back to a hard-coded prod URL if needed.
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (origin) return new URL(origin).origin;
  return "https://plaindharma.com";
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Stripe is not configured (STRIPE_SECRET_KEY missing)." },
      { status: 500 }
    );
  }

  let body: { amount?: unknown; file?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < MIN_CENTS || amount > MAX_CENTS) {
    return NextResponse.json(
      { error: `Amount must be between ${MIN_CENTS} and ${MAX_CENTS} cents.` },
      { status: 400 }
    );
  }

  const file = String(body.file);
  if (!VALID_FILES.includes(file as FileSlug)) {
    return NextResponse.json(
      { error: `File must be one of: ${VALID_FILES.join(", ")}` },
      { status: 400 }
    );
  }

  const stripe = new Stripe(secret);
  const baseUrl = getBaseUrl(req);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amount),
            product_data: {
              name: "Plain Dharma — donation",
              description: PRODUCT_DESCRIPTION[file as FileSlug],
            },
          },
        },
      ],
      // submit_type=donate hides the "buy" framing and shows "donate" on
      // Stripe's hosted page — fits the actual intent here.
      submit_type: "donate",
      // Always create a Stripe Customer record so donors are searchable in
      // the Dashboard, repeat donations roll up under one person, and we can
      // run follow-up emails later if we ever want to.
      customer_creation: "always",
      success_url: `${baseUrl}/download/thank-you?file=${file}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/download/donate?file=${file}&cancelled=1`,
      metadata: { file },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 }
      );
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Stripe error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
