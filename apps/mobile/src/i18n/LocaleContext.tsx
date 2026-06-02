/**
 * App-wide reading language (English / 中文). Mirrors ThemeContext: a persisted
 * preference (AsyncStorage), defaulting to DEFAULT_LOCALE on first run. Every
 * reading surface reads `useLocale().locale` instead of the hardcoded
 * DEFAULT_LOCALE, and the More tab's Language control flips it. The whole
 * content/audio/strings stack is already locale-parameterized, so switching
 * re-renders text + swaps the audio manifest with no rebuild.
 */

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@plain-dharma/content";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "locale";

function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(v);
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (isLocale(v)) setLocaleState(v);
      })
      .catch(() => {});
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const value = useMemo<LocaleContextValue>(() => ({ locale, setLocale }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}

/** Human-facing language names for the Language switcher (endonyms). */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  zh: "中文",
};
