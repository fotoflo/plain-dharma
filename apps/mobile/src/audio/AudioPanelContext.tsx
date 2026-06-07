import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AudioPanelValue = {
  /** Whether the floating listen panel is open. Lives here (above the tabs) so
   *  it survives navigation — the donate screen can set it and the Read tab
   *  picks it up on focus without a mount-timing race. */
  audioOpen: boolean;
  setAudioOpen: (open: boolean) => void;
};

const Ctx = createContext<AudioPanelValue | null>(null);

export function AudioPanelProvider({ children }: { children: ReactNode }) {
  const [audioOpen, setAudioOpen] = useState(false);
  const value = useMemo(() => ({ audioOpen, setAudioOpen }), [audioOpen]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAudioPanel(): AudioPanelValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAudioPanel must be used within AudioPanelProvider");
  return ctx;
}
