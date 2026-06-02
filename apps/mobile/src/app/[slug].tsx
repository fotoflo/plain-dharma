import { getMeta, isSuttaSlug } from "@plain-dharma/content";
import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
// gesture-handler's ScrollView coordinates with nested Gesture.Pan recognizers
// (the plain RN ScrollView swallows the long-press-to-select drag). Same
// scrollTo ref API, so the audio-follow autoscroll below is unaffected.
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAudio } from "@/audio/AudioProvider";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { FloatingControls } from "@/components/FloatingControls";
import { getSuttaMarkdown, splitSections } from "@/content/markdown";
import { useLocale } from "@/i18n/LocaleContext";
import { GlobalNotesPanel } from "@/marginalia/GlobalNotesPanel";
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
  const { locale } = useLocale();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { sections: audioSections, index } = useAudio();

  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});
  const didMount = useRef(false);

  // Global "all notes" list (every mark across all suttas), reachable from the
  // per-talk panel's footer — the reader is the home for the reader's own
  // content (see docs/architecture/more-tab-refactor.md).
  const [showAllNotes, setShowAllNotes] = useState(false);

  // Margin Notes for this sutta. `slug` may be invalid (handled below) — pass a
  // safe fallback so the hook order stays stable; we only render its UI when the
  // slug is valid.
  const safeSlug = slug && isSuttaSlug(slug) ? slug : "";
  const mn = useSuttaMarginalia(safeSlug, locale);

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

  // Section list + selection callbacks are memoized/stable so opening the
  // toolbar (a state change) doesn't hand SelectableSection new props and
  // re-render the UITextView subtree — which would drop the live native
  // selection mid-gesture. `mn.onSelect`/`beginEdit`/`closeSelection` are
  // already stable (useCallback in the hook); we resolve the section from the
  // reported sectionId rather than closing over the mapped `sec`.
  const { onSelect: mnOnSelect, beginEdit, closeSelection, marksForSlug } = mn;

  const contentSections = useMemo(
    () => (safeSlug ? splitSections(getSuttaMarkdown(locale, safeSlug)) : []),
    [safeSlug, locale],
  );

  const handlePressHighlight = useCallback(
    (id: string) => {
      const mark = marksForSlug.find((m) => m.id === id);
      if (mark) beginEdit(mark);
    },
    [marksForSlug, beginEdit],
  );

  const handleSelect = useCallback(
    (result: SelectionResult) => {
      const sec = contentSections.find((s) => s.id === result.sectionId);
      if (sec) mnOnSelect(result, sec);
    },
    [contentSections, mnOnSelect],
  );

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

  const meta = getMeta(locale, slug);

  // Toolbar geometry (web parity): the toolbar is a screen-absolute overlay
  // anchored to the selection's window-coordinate rect — centred over the
  // selection, clamped to the viewport, floating just above it and flipping
  // below when it would clip the top (under the safe-area inset).
  const screen = Dimensions.get("window");
  const toolbarPos = mn.toolbar
    ? (() => {
        const r = mn.toolbar;
        const centerX = r.x + r.width / 2;
        const left = Math.min(
          Math.max(centerX - TOOLBAR_WIDTH / 2, 8),
          screen.width - TOOLBAR_WIDTH - 8,
        );
        const above = r.y - TOOLBAR_HEIGHT - 8;
        const top = above < insets.top + 8 ? r.y + r.height + 8 : above;
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
                onPressHighlight={handlePressHighlight}
                onSelect={handleSelect}
                onSelectionCleared={closeSelection}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* Selection toolbar — a screen-absolute overlay anchored to the
          selection's window-coordinate rect (sibling of the ScrollView, not a
          child, so it positions in window space and stays above the content). */}
      {mn.toolbarVisible && toolbarPos && (
        <SelectionToolbar
          anchor={toolbarPos}
          onHighlight={mn.highlightSelection}
          onNote={mn.noteFromSelection}
          onCopy={mn.copyFromSelection}
          onShare={mn.shareFromSelection}
        />
      )}

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
        signedIn={mn.signedIn}
        email={mn.email}
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
        onSignOut={() => {
          mn.setPanelOpen(false);
          void mn.signOut();
        }}
        onShowAll={() => {
          mn.setPanelOpen(false);
          setShowAllNotes(true);
        }}
      />

      <GlobalNotesPanel visible={showAllNotes} onClose={() => setShowAllNotes(false)} />

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

      <FloatingControls locale={locale} slug={slug} />
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
