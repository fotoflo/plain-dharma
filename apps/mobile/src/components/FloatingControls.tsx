import type { Locale, SuttaSlug } from "@plain-dharma/content";
import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { useAudioPanel } from "@/audio/AudioPanelContext";

import { FloatingAudioPlayer } from "./FloatingAudioPlayer";
import { FloatingReadingControls } from "./FloatingReadingControls";

// Owns the open-state shared by the two floating popovers (reading settings,
// audio player) so only ONE can be open at a time, and renders a full-screen
// backdrop that closes whichever is open when you tap outside it. The FABs and
// panels paint above the backdrop (later siblings + zIndex), so tapping them
// still hits the control rather than dismissing.
export function FloatingControls({
  locale,
  slug,
  combined = false,
}: {
  locale: Locale;
  slug?: SuttaSlug;
  combined?: boolean;
}) {
  // Audio-panel open state lives in the shared context (so the donate screen can
  // open it and it survives the bounce back to Read); the reading panel is local.
  const { audioOpen, setAudioOpen } = useAudioPanel();
  const [readingOpen, setReadingOpen] = useState(false);
  const open = audioOpen ? "audio" : readingOpen ? "reading" : null;

  const closeAll = () => {
    setAudioOpen(false);
    setReadingOpen(false);
  };
  const toggleReading = () => {
    setAudioOpen(false);
    setReadingOpen((v) => !v);
  };
  const toggleAudio = () => {
    setReadingOpen(false);
    setAudioOpen(!audioOpen);
  };

  return (
    <>
      {open ? (
        <Pressable
          style={styles.backdrop}
          onPress={closeAll}
          accessibilityLabel="Close"
        />
      ) : null}
      <FloatingReadingControls
        open={open === "reading"}
        onToggle={toggleReading}
      />
      <FloatingAudioPlayer
        locale={locale}
        slug={slug}
        combined={combined}
        open={open === "audio"}
        onToggle={toggleAudio}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Sits above the scroll content but below the FABs/panels (zIndex 10).
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 },
});
