/**
 * Newsletter subscription endpoint. On signup we send two transactional emails
 * via Resend: a welcome to the subscriber, and a notification to the site
 * owner. There is no contact list/audience — the signup *is* the two emails.
 *
 * Required env:
 *   RESEND_API_KEY — from https://resend.com/api-keys
 *
 * Mail is sent from plaindharma.com, which must be a verified domain in Resend
 * (DKIM/SPF/DMARC records live in DNS). Until that domain shows "Verified",
 * Resend will reject the send and this route returns 502.
 */

import { NextResponse } from "next/server";
import { Resend } from "resend";

// Defensive bounds — short enough to fit a real email, long enough for edge
// cases (e.g. corporate addresses with long local parts).
const MIN_EMAIL_LEN = 3;
const MAX_EMAIL_LEN = 254; // RFC-permitted maximum
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Visible sender — must be a mailbox on the Resend-verified plaindharma.com.
const FROM = "Plain Dharma <hello@plaindharma.com>";
// Where new-signup notifications land.
const NOTIFY_TO = "fotoflo@gmail.com";

const WELCOME_TEXT = `Welcome to Plain Dharma.

Thank you for subscribing. Plain Dharma offers six foundational Buddhist suttas in plain modern English — free, and dedicated to the public domain.

Begin reading anytime: https://plaindharma.com/read

We'll only write when there's something worth your attention.

— Plain Dharma`;

// Hero art is served as a plain static file from the production site (no Next
// <Image> optimization / cache-busting query — email clients need a stable
// absolute URL). Light palette is set explicitly so the card survives
// dark-mode email clients.
const WELCOME_HTML = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe6;margin:0;padding:0;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:480px;background:#fbf8f2;border:1px solid #e7ddcb;border-radius:14px;">
        <tr>
          <td style="padding:36px 36px 40px;font-family:Georgia,'Times New Roman',serif;color:#2b2622;">
            <div style="text-align:center;margin:0 0 18px;">
              <img src="https://plaindharma.com/logo/mark.png" width="44" height="44" alt="" style="display:inline-block;width:44px;height:44px;border:0;" />
            </div>
            <h1 style="font-size:24px;font-weight:normal;text-align:center;line-height:1.3;margin:0 0 22px;">Welcome to Plain Dharma</h1>
            <div style="text-align:center;margin:0 0 26px;">
              <a href="https://plaindharma.com/read" style="text-decoration:none;">
                <img src="https://plaindharma.com/illustrations/first-talk.png" width="280" height="280" alt="Plain Dharma illustration" style="display:inline-block;width:280px;max-width:100%;height:auto;border:0;border-radius:12px;" />
              </a>
            </div>
            <p style="font-size:16px;line-height:1.65;margin:0 0 16px;">Thank you for subscribing. Plain Dharma offers six foundational Buddhist suttas in plain modern English — free, and dedicated to the public domain.</p>
            <p style="font-size:16px;line-height:1.65;margin:0 0 16px;"><a href="https://plaindharma.com/read" style="color:#9a6a3c;">Begin reading anytime &rarr;</a></p>
            <p style="font-size:16px;line-height:1.65;margin:0 0 24px;">We'll only write when there's something worth your attention.</p>
            <p style="font-size:16px;line-height:1.65;margin:0;color:#6b6258;">— Plain Dharma</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
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

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (
    email.length < MIN_EMAIL_LEN ||
    email.length > MAX_EMAIL_LEN ||
    !EMAIL_REGEX.test(email)
  ) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const resend = new Resend(apiKey);

  // Welcome to the subscriber (decides the user-facing result) and the owner
  // notification (best-effort) go out together. replyTo on the notification
  // lets the owner answer the new subscriber directly.
  const [welcome, notify] = await Promise.allSettled([
    resend.emails.send({
      from: FROM,
      to: email,
      subject: "Welcome to Plain Dharma",
      text: WELCOME_TEXT,
      html: WELCOME_HTML,
    }),
    resend.emails.send({
      from: FROM,
      to: NOTIFY_TO,
      replyTo: email,
      subject: "New Plain Dharma subscriber",
      text: `New newsletter signup: ${email}`,
    }),
  ]);

  if (notify.status === "rejected" || notify.value.error) {
    console.error(
      "[subscribe] owner notification failed",
      notify.status === "rejected" ? notify.reason : notify.value.error
    );
  }

  if (welcome.status === "rejected" || welcome.value.error) {
    console.error(
      "[subscribe] welcome email failed",
      welcome.status === "rejected" ? welcome.reason : welcome.value.error
    );
    return NextResponse.json(
      { error: "We couldn't complete your signup. Try again in a minute?" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
