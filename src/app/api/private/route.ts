/**
 * PIN gate for the private publishing fill-sheet (`/private`).
 *
 * The site is otherwise a static/no-auth reading site; this is a deliberate
 * server-side carve-out (alongside /api/checkout, /api/subscribe,
 * /api/contribute) so that BOTH the PIN and the fill-sheet content stay
 * server-side and never reach the client bundle. A correct PIN returns the
 * sections; a wrong one returns 401 with no hint of the content.
 *
 * Required env:
 *   PRIVATE_PIN — the access PIN (e.g. 9265). Set in .env.local and on Vercel.
 *
 * This is light obscurity, not strong security — the protected data is
 * publishing metadata that's headed to a public Amazon page anyway. It exists
 * to keep the fill-sheet off the open web and out of search.
 */

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { SECTIONS } from "./fill-sheet";

// A constant-time compare that doesn't leak length via early return. Both sides
// are hashed to a fixed width first so unequal lengths still take the same path.
function pinMatches(input: string, expected: string): boolean {
  const a = Buffer.from(input.padEnd(64).slice(0, 64));
  const b = Buffer.from(expected.padEnd(64).slice(0, 64));
  return timingSafeEqual(a, b) && input.length === expected.length;
}

export async function POST(req: Request) {
  const expected = process.env.PRIVATE_PIN;
  if (!expected) {
    return NextResponse.json(
      { error: "Private area is not configured." },
      { status: 503 }
    );
  }

  let body: { pin?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const pin = typeof body.pin === "string" ? body.pin.trim() : "";
  if (!pin || !pinMatches(pin, expected)) {
    return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
  }

  return NextResponse.json({ sections: SECTIONS });
}
