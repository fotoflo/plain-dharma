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
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  CHINESE_SCRIPTS,
  DEFAULT_SCRIPT,
  toCanonicalScript,
  toDisplayScript,
  type ChineseScript,
} from "./zhScript";

const STORAGE_KEY = "locale";
const SCRIPT_KEY = "zh-script";

function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(v);
}

function isScript(v: unknown): v is ChineseScript {
  return typeof v === "string" && (CHINESE_SCRIPTS as readonly string[]).includes(v);
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Chinese script preference; only meaningful when locale === "zh". */
  script: ChineseScript;
  setScript: (script: ChineseScript) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [script, setScriptState] = useState<ChineseScript>(DEFAULT_SCRIPT);

  useEffect(() => {
    AsyncStorage.multiGet([STORAGE_KEY, SCRIPT_KEY])
      .then((pairs) => {
        const map = Object.fromEntries(pairs);
        if (isLocale(map[STORAGE_KEY])) setLocaleState(map[STORAGE_KEY] as Locale);
        if (isScript(map[SCRIPT_KEY])) setScriptState(map[SCRIPT_KEY] as ChineseScript);
      })
      .catch(() => {});
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const setScript = (next: ChineseScript) => {
    setScriptState(next);
    AsyncStorage.setItem(SCRIPT_KEY, next).catch(() => {});
  };

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, script, setScript }),
    [locale, script],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}

/**
 * Script converters bound to the current locale/script. `toDisplay` renders the
 * canonical (Simplified) text in the reader's chosen script; `toCanonical`
 * folds a selection back to Simplified for storage. Both are identity unless
 * the reader is in zh + 繁體, so non-zh surfaces pay nothing.
 */
export function useZhConvert(): {
  isHant: boolean;
  toDisplay: (text: string) => string;
  toCanonical: (text: string) => string;
} {
  const { locale, script } = useLocale();
  const isHant = locale === "zh" && script === "hant";
  const toDisplay = useCallback((t: string) => toDisplayScript(t, isHant), [isHant]);
  const toCanonical = useCallback((t: string) => toCanonicalScript(t, isHant), [isHant]);
  return { isHant, toDisplay, toCanonical };
}

/** Human-facing language names for the Language switcher (endonyms). */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  zh: "中文",
};
