"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function fileSlug(raw: string | null): "epub" | "pdf" | "m4b" {
  return raw === "pdf" || raw === "m4b" ? raw : "epub";
}

// This page is the Universal Link / App Link target that Stripe redirects to.
// On a device with the app installed, the OS opens the app before this renders.
// The custom-scheme bounce + manual links are the fallback when the OS didn't
// auto-open (link verification still propagating, etc.). The app's deep-link
// listener reads the `to` query off whichever URL it receives.
export function Return() {
  const params = useSearchParams();
  const to = params.get("to") === "cancel" ? "cancel" : "thankyou";
  const file = fileSlug(params.get("file"));
  const appLink = `mobile://download/donate?to=${to}&file=${file}`;
  const fileHref = `/downloads/plain-dharma.${file}`;
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    window.location.replace(appLink);
    const t = setTimeout(() => setStuck(true), 2000);
    return () => clearTimeout(t);
  }, [appLink]);

  return (
    <div className="space-y-6">
      <p className="font-serif text-lg text-ink/80">Returning to the app…</p>
      {stuck && (
        <div className="space-y-4">
          <a
            href={appLink}
            className="inline-flex items-center rounded-full bg-accent-strong px-6 py-3 font-sans text-base font-medium text-white no-underline shadow-sm transition hover:no-underline hover:opacity-90"
          >
            Open the Plain Dharma app
          </a>
          <p className="font-serif text-sm text-ink/60">
            Don&rsquo;t have the app?{" "}
            <a
              href={fileHref}
              download
              className="text-link underline-offset-4 hover:text-accent hover:underline"
            >
              Download the file →
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
