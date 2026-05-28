import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  READING_SCALE,
  type Contrast,
  type ReadingFont,
  type ReadingSize,
} from "./tokens";

// Mirrors the web localStorage keys.
const KEYS = {
  size: "pd-reading-size",
  contrast: "pd-reading-contrast",
  font: "pd-reading-font",
} as const;

const SIZES: ReadingSize[] = ["sm", "md", "lg", "xl"];
const CONTRASTS: Contrast[] = ["low", "med", "high"];
const READING_FONTS: ReadingFont[] = ["serif", "accessible"];

type ReadingPrefsValue = {
  size: ReadingSize;
  contrast: Contrast;
  font: ReadingFont;
  /** READING_SCALE[size] — the type-size multiplier. */
  scale: number;
  setSize: (s: ReadingSize) => void;
  setContrast: (c: Contrast) => void;
  setFont: (f: ReadingFont) => void;
};

const ReadingPrefsContext = createContext<ReadingPrefsValue | null>(null);

export function ReadingPrefsProvider({ children }: { children: ReactNode }) {
  const [size, setSizeState] = useState<ReadingSize>("md");
  const [contrast, setContrastState] = useState<Contrast>("med");
  const [font, setFontState] = useState<ReadingFont>("serif");

  useEffect(() => {
    (async () => {
      try {
        const [s, c, f] = await Promise.all([
          AsyncStorage.getItem(KEYS.size),
          AsyncStorage.getItem(KEYS.contrast),
          AsyncStorage.getItem(KEYS.font),
        ]);
        if (s && SIZES.includes(s as ReadingSize)) setSizeState(s as ReadingSize);
        if (c && CONTRASTS.includes(c as Contrast))
          setContrastState(c as Contrast);
        if (f && READING_FONTS.includes(f as ReadingFont))
          setFontState(f as ReadingFont);
      } catch {
        // ignore — fall back to defaults
      }
    })();
  }, []);

  const setSize = (s: ReadingSize) => {
    setSizeState(s);
    AsyncStorage.setItem(KEYS.size, s).catch(() => {});
  };
  const setContrast = (c: Contrast) => {
    setContrastState(c);
    AsyncStorage.setItem(KEYS.contrast, c).catch(() => {});
  };
  const setFont = (f: ReadingFont) => {
    setFontState(f);
    AsyncStorage.setItem(KEYS.font, f).catch(() => {});
  };

  const value = useMemo<ReadingPrefsValue>(
    () => ({
      size,
      contrast,
      font,
      scale: READING_SCALE[size],
      setSize,
      setContrast,
      setFont,
    }),
    [size, contrast, font]
  );

  return (
    <ReadingPrefsContext.Provider value={value}>
      {children}
    </ReadingPrefsContext.Provider>
  );
}

export function useReadingPrefs(): ReadingPrefsValue {
  const ctx = useContext(ReadingPrefsContext);
  if (!ctx)
    throw new Error("useReadingPrefs must be used within a ReadingPrefsProvider");
  return ctx;
}
