"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getLocaleFromPathname,
  switchLocalePath,
} from "@/lib/locale-href";

// Label shown ON the switcher is the TARGET locale (i.e. what you'll get
// by clicking). When you're on EN, the switcher shows "中" (click to go to ZH).
// When you're on ZH, the switcher shows "EN" (click to go to EN).
const LABELS = {
  en: "EN",
  zh: "中",
} as const;

const ARIA = {
  en: "Switch to English",
  zh: "切换为中文",
} as const;

export function LocaleSwitcher() {
  const pathname = usePathname() ?? "/";
  const current = getLocaleFromPathname(pathname);
  const target = current === "en" ? "zh" : "en";
  const href = switchLocalePath(pathname, target);

  return (
    <Link
      href={href}
      aria-label={ARIA[target]}
      className="font-sans inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm text-ink/70 no-underline transition-colors hover:bg-divider/40 hover:text-accent hover:no-underline"
    >
      {LABELS[target]}
    </Link>
  );
}
