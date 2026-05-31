import { DEFAULT_LOCALE, getMeta, isSuttaSlug } from "@plain-dharma/content";
import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAudio } from "@/audio/AudioProvider";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { FloatingControls } from "@/components/FloatingControls";
import { getSuttaMarkdown, splitSections } from "@/content/markdown";
import { MarginNotesPanel } from "@/marginalia/MarginNotesPanel";
import { NoteComposer } from "@/marginalia/NoteComposer";
import { SavePrompt } from "@/marginalia/SavePrompt";
import { SelectableSection, type SelectionResult } from "@/marginalia/SelectableSection";
import {
  SelectionToolbar,
  TOOLBAR_HEIGHT,
  TOOLBAR_WIDTH,
} from "@/marginalia/SelectionToolbar";
import { ShareSheet } from "@/marginalia/ShareSheet";
import { Toast } from "@/marginalia/Toast";
import { useSuttaMarginalia } from "@/marginalia/useSuttaMarginalia";
import { useReadingPrefs } from "@/theme/ReadingPrefsContext";
import { useTheme } from "@/theme/ThemeContext";
import { CONTRAST_BG, FONTS } from "@/theme/tokens";

const PAGE_PADDING = 24;

export default function SuttaScreen() {
  const { theme, palette } = useTheme();
  const { contrast } = useReadingPrefs();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { sections: audioSections, index } = useAudio();

  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});
  const didMount = useRef(false);

  // Margin Notes for this sutta. `slug` may be invalid (handled below) — pass a
  // safe fallback so the hook order stays stable; we only render its UI when the
  // slug is valid.
  const safeSlug = slug && isSuttaSlug(slug) ? slug : "";
  const mn = useSuttaMarginalia(safeSlug, DEFAULT_LOCALE);

  // Active audio section, with the combined "slug--section" prefix stripped.
  const activeId = audioSections[index]?.id?.split("--").pop();

  const recordPos = useCallback((id: string) => (e: LayoutChangeEvent) => {
    positions.current[id] = e.nativeEvent.layout.y;
  }, []);

  // Follow the audio: scroll to the section it just moved to. Skip the first
  // run so we don't yank the page on load.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (!activeId) return;
    const y = positions.current[activeId];
    if (y != null) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
    }
  }, [activeId]);

  const scrollToAnchor = useCallback((anchor: string) => {
    const y = positions.current[anchor];
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
  }, []);

  const screenBg = CONTRAST_BG[theme][contrast] ?? palette.bg;

  if (!slug || !isSuttaSlug(slug)) {
    return (
      <View style={[styles.center, { backgroundColor: palette.bg }]}>
        <Text style={{ color: palette.ink, fontFamily: FONTS.serif }}>Not found.</Text>
        <Link href="/" style={{ color: palette.link, marginTop: 12 }}>
          ← Home
        </Link>
      </View>
    );
  }

  const meta = getMeta(DEFAULT_LOCALE, slug);
  const contentSections = splitSections(getSuttaMarkdown(DEFAULT_LOCALE, slug));

  // Inner content width (screen minus the symmetric page padding) — used to
  // clamp the floating toolbar so it never runs off either edge.
  const innerWidth = Dimensions.get("window").width - PAGE_PADDING * 2;

  // Final toolbar geometry: centre over the selection, clamp horizontally,
  // float above and flip below when it would clip the content top.
  const toolbarPos = mn.toolbar
    ? (() => {
        const left = Math.min(
          Math.max(mn.toolbar.left - TOOLBAR_WIDTH / 2, 0),
          Math.max(innerWidth - TOOLBAR_WIDTH, 0),
        );
        const above = mn.toolbar.top - TOOLBAR_HEIGHT - 8;
        const top = above < 0 ? mn.toolbar.top + 32 : above;
        return { left, top };
      })()
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: screenBg }}>
      <DecorativeBackground />
      <ScrollView
        ref={scrollRef}
        style={{ backgroundColor: "transparent" }}
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 96,
          paddingHorizontal: PAGE_PADDING,
        }}
      >
        <Link href="/" style={[styles.back, { color: palette.link, fontFamily: FONTS.serif }]}>
          ← All talks
        </Link>

        <View onLayout={recordPos("title")} style={{ marginBottom: 8 }}>
          <Text style={[styles.kicker, { color: palette.accent, fontFamily: FONTS.serif }]}>
            {meta.kicker_override ?? meta.pali_name}
          </Text>
          <Text style={[styles.h1, { color: palette.ink, fontFamily: FONTS.serifBold }]}>
            {meta.title}
          </Text>
          <Text style={[styles.subtitle, { color: palette.ink, fontFamily: FONTS.serifItalic }]}>
            {meta.subtitle}
          </Text>
        </View>

        {/* The selection toolbar lives inside the scroll content so it scrolls
            with the passage and stays pinned to the dragged words. */}
        {mn.toolbarVisible && toolbarPos && (
          <SelectionToolbar
            anchor={toolbarPos}
            activeColor={mn.selectionColor}
            onColor={mn.highlightWithColor}
            onNote={mn.noteFromSelection}
            onShare={mn.shareFromSelection}
          />
        )}

        {contentSections.map((sec) => {
          const inline = mn.inlineHighlightsFor(sec);
          const marked = mn.markedAnchors.has(sec.id);
          // Inline shading is the primary affordance (web parity). The accent
          // rail is only a fallback for a marked section whose quote couldn't be
          // resolved into a render leaf (e.g. a cross-style quote — see the
          // parity note in useSuttaMarginalia).
          const railFallback = marked && inline.length === 0;
          return (
            <View
              key={sec.id}
              onLayout={recordPos(sec.id)}
              style={[
                railFallback && {
                  borderLeftWidth: 3,
                  borderLeftColor: palette.accent,
                  paddingLeft: 12,
                  marginLeft: -15,
                  backgroundColor: palette.accent + "12",
                },
              ]}
            >
              <SelectableSection
                section={sec}
                highlights={inline}
                selectionColor={mn.selectionColor}
                cleared={mn.clearToken}
                onPressHighlight={(id) => {
                  const mark = mn.marksForSlug.find((m) => m.id === id);
                  if (mark) mn.beginEdit(mark);
                }}
                onSelect={(result: SelectionResult, sectionTop: number) => {
                  // sectionTop from the section's own onLayout is relative to the
                  // content container — prefer the reader's recorded value (same
                  // space) when present, fall back to the reported one.
                  const top = positions.current[sec.id] ?? sectionTop;
                  mn.onSelect(result, sec, top);
                }}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* "My notes" floating button — count badge, opens the per-sutta list. */}
      <Pressable
        onPress={() => mn.setPanelOpen(true)}
        accessibilityLabel="Margin notes"
        style={[
          styles.notesFab,
          { borderColor: palette.accent, backgroundColor: palette.bg, bottom: insets.bottom + 20 },
        ]}
      >
        <Ionicons name="bookmark-outline" size={18} color={palette.accent} />
        {mn.marksForSlug.length > 0 ? (
          <Text style={{ color: palette.accent, fontFamily: FONTS.serif, fontSize: 14 }}>
            {mn.marksForSlug.length}
          </Text>
        ) : null}
      </Pressable>

      <MarginNotesPanel
        visible={mn.panelOpen}
        title="Notes on this talk"
        marks={mn.marksForSlug}
        onClose={() => mn.setPanelOpen(false)}
        onEdit={(m) => {
          mn.setPanelOpen(false);
          mn.beginEdit(m);
        }}
        onRemove={(id) => mn.remove(id)}
        onShare={(m) => {
          mn.setPanelOpen(false);
          mn.shareMark(m);
        }}
        onJump={(m) => {
          mn.setPanelOpen(false);
          scrollToAnchor(m.anchor);
        }}
      />

      <NoteComposer
        visible={mn.composerVisible}
        quote={mn.composerQuote}
        initialNote={mn.composerInitialNote}
        initialColor={mn.composerInitialColor}
        onSave={mn.saveComposer}
        onCancel={mn.closeComposer}
      />

      <ShareSheet visible={mn.share != null} payload={mn.share} onClose={mn.closeShare} />

      <SavePrompt
        visible={mn.savePromptVisible}
        onSend={mn.onSavePromptSend}
        onDismiss={mn.dismissSavePrompt}
      />

      <Toast message={mn.toast} />

      <FloatingControls locale={DEFAULT_LOCALE} slug={slug} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  back: { fontSize: 16, marginBottom: 20 },
  kicker: {
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  h1: { fontSize: 30, lineHeight: 36, marginBottom: 10 },
  subtitle: { fontSize: 18, lineHeight: 26 },
  notesFab: {
    position: "absolute",
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    zIndex: 20,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
