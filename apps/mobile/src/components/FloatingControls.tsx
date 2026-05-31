import type { Locale, SuttaSlug } from "@plain-dharma/content";
import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { FloatingAudioPlayer } from "./FloatingAudioPlayer";
import { FloatingReadingControls } from "./FloatingReadingControls";

type Panel = "reading" | "audio" | null;

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
  const [panel, setPanel] = useState<Panel>(null);
  const toggle = (which: Exclude<Panel, null>) =>
    setPanel((cur) => (cur === which ? null : which));

  return (
    <>
      {panel ? (
        <Pressable
          style={styles.backdrop}
          onPress={() => setPanel(null)}
          accessibilityLabel="Close"
        />
      ) : null}
      <FloatingReadingControls
        open={panel === "reading"}
        onToggle={() => toggle("reading")}
      />
      <FloatingAudioPlayer
        locale={locale}
        slug={slug}
        combined={combined}
        open={panel === "audio"}
        onToggle={() => toggle("audio")}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Sits above the scroll content but below the FABs/panels (zIndex 10).
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 },
});
