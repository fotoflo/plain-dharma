import { SUPPORTED_LOCALES, type Locale } from "@plain-dharma/content";
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
  downloadLocale,
  isLocaleDownloaded,
  removeLocale,
  type DownloadProgress,
} from "./downloads";

type DownloadsContextValue = {
  downloaded: Record<Locale, boolean>;
  /** Locale currently downloading, or null. */
  busyLocale: Locale | null;
  progress: DownloadProgress | null;
  error: string | null;
  download: (locale: Locale) => Promise<void>;
  remove: (locale: Locale) => Promise<void>;
};

const DownloadsContext = createContext<DownloadsContextValue | null>(null);

const emptyFlags = () =>
  Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, false])) as Record<
    Locale,
    boolean
  >;

export function DownloadsProvider({ children }: { children: ReactNode }) {
  const [downloaded, setDownloaded] = useState<Record<Locale, boolean>>(emptyFlags);
  const [busyLocale, setBusyLocale] = useState<Locale | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const entries = await Promise.all(
        SUPPORTED_LOCALES.map(
          async (l) => [l, await isLocaleDownloaded(l)] as const
        )
      );
      setDownloaded(Object.fromEntries(entries) as Record<Locale, boolean>);
    })();
  }, []);

  const download = useCallback(async (locale: Locale) => {
    setBusyLocale(locale);
    setError(null);
    setProgress({ done: 0, total: 0 });
    try {
      await downloadLocale(locale, setProgress);
      setDownloaded((prev) => ({ ...prev, [locale]: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setBusyLocale(null);
      setProgress(null);
    }
  }, []);

  const remove = useCallback(async (locale: Locale) => {
    await removeLocale(locale);
    setDownloaded((prev) => ({ ...prev, [locale]: false }));
  }, []);

  const value = useMemo<DownloadsContextValue>(
    () => ({ downloaded, busyLocale, progress, error, download, remove }),
    [downloaded, busyLocale, progress, error, download, remove]
  );

  return (
    <DownloadsContext.Provider value={value}>
      {children}
    </DownloadsContext.Provider>
  );
}

export function useDownloads(): DownloadsContextValue {
  const ctx = useContext(DownloadsContext);
  if (!ctx)
    throw new Error("useDownloads must be used within a DownloadsProvider");
  return ctx;
}
