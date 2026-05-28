"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/locale-href";
import { SUTTAS } from "@/content";
import {
  type AnnotationSelector,
  decodeSelector,
  encodeSelector,
  rangeFromSelector,
  selectorFromRange,
  unwrapMark,
  wrapRange,
} from "./textAnchor";
import { MARGINALIA_STRINGS as t } from "./strings";
import { getMarks, newMark, requestPersistence } from "./store";
import type { MarginMark } from "./types";
import { useMarginalia } from "./useMarginalia";
import NoteComposer from "./NoteComposer";
import ShareDialog from "./ShareDialog";
import MarginNotesPanel from "./MarginNotesPanel";
import SavePrompt from "./SavePrompt";

const NAV_H = 80; // keep the toolbar clear of the fixed site nav
const PROMPT_KEY = "pd-mn-prompt";
const SUTTA_SLUGS = SUTTAS as readonly string[];

/** Page grouping key from the path: a sutta slug on /[slug], "read" on /read,
 *  else the page name ("about", "home", …). Locale prefix is stripped so a
 *  passage keeps the same key in every language. */
function pageKeyFromPath(pathname: string): string {
  const stripped = pathname
    .replace(/^\/(?:zh)(?=\/|$)/, "")
    .replace(/^\//, "")
    .replace(/\/$/, "");
  return stripped || "home";
}

/* ── tiny inline glyphs ─────────────────────────────────────────────────── */
function IconHighlight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h6M14 4l6 6L9 21l-6 1 1-6L14 4Z" />
    </svg>
  );
}
function IconNote() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
function IconCopy() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}
function IconShare() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

export default function Marginalia() {
  const pathname = usePathname() ?? "/";
  // Reading surfaces only: the per-sutta pages and /read. Off on home, /about,
  // /contribute, /download, glossary — anywhere that isn't the texts themselves.
  const reading = useMemo(() => {
    const key = pageKeyFromPath(pathname);
    return key === "read" || SUTTA_SLUGS.includes(key);
  }, [pathname]);
  if (!reading) return null;
  return <MarginaliaLayer pathname={pathname} />;
}

function MarginaliaLayer({ pathname }: { pathname: string }) {
  const locale = getLocaleFromPathname(pathname);
  const pageKey = useMemo(() => pageKeyFromPath(pathname), [pathname]);
  const isRead = pageKey === "read";

  const { marks, signedIn, email, add, updateNote, remove, signIn, signOut } = useMarginalia();

  const [toolbar, setToolbar] = useState<{ selector: AnnotationSelector; rect: DOMRect; slug: string } | null>(null);
  const [popover, setPopover] = useState<{ mark: MarginMark; rect: DOMRect } | null>(null);
  const [composer, setComposer] = useState<
    | { kind: "new"; selector: AnnotationSelector; slug: string }
    | { kind: "edit"; mark: MarginMark }
    | null
  >(null);
  const [share, setShare] = useState<{ url: string; quote: string; title: string } | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [savePrompt, setSavePrompt] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const paintedRef = useRef<Set<string>>(new Set());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const modalOpen = composer !== null || share !== null || panelOpen || savePrompt;
  const modalOpenRef = useRef(false);
  useEffect(() => {
    modalOpenRef.current = modalOpen;
  }, [modalOpen]);

  // Marks that belong to this page: every sutta's on /read, this page's
  // elsewhere — and only in the language currently being read.
  const pageMarks = useMemo(
    () =>
      marks.filter(
        (m) =>
          m.locale === locale && (isRead ? SUTTA_SLUGS.includes(m.slug) : m.slug === pageKey),
      ),
    [marks, isRead, pageKey, locale],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  // Client navigation between reading pages keeps this component mounted, so
  // reset paint tracking when the path changes — the old DOM marks are gone and
  // the new page's need repainting.
  useEffect(() => {
    paintedRef.current = new Set();
  }, [pathname]);

  // The single annotatable scope — the page's <main data-mn-scope>.
  const scopeEl = useCallback((): HTMLElement | null => document.querySelector("[data-mn-scope]"), []);

  /* ── paint marks not yet on the page ──────────────────────────────────── */
  useEffect(() => {
    const main = scopeEl();
    if (!main) return;
    for (const mark of pageMarks) {
      if (paintedRef.current.has(mark.id)) continue;
      if (document.querySelector(`mark[data-mark-id="${CSS.escape(mark.id)}"]`)) {
        paintedRef.current.add(mark.id);
        continue;
      }
      const range = rangeFromSelector(
        { anchor: mark.anchor, quote: mark.quote, prefix: mark.prefix, suffix: mark.suffix },
        main,
      );
      if (!range) continue; // passage isn't on this page (yet) — leave for a later pass
      const cls = mark.note ? "dharma-mark dharma-mark-note" : "dharma-mark";
      const painted = wrapRange(range, cls, {
        markId: mark.id,
        markKind: mark.note ? "note" : "highlight",
      });
      if (mark.note) painted.forEach((el) => (el.title = mark.note as string));
      paintedRef.current.add(mark.id);
    }
  }, [pageMarks, scopeEl]);

  /* ── selection → floating toolbar ─────────────────────────────────────── */
  useEffect(() => {
    const evaluate = () => {
      if (modalOpenRef.current) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setToolbar(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const startEl =
        range.startContainer.nodeType === Node.TEXT_NODE
          ? range.startContainer.parentElement
          : (range.startContainer as HTMLElement);
      if (startEl?.closest("[data-mn-ui]")) {
        setToolbar(null);
        return; // selection inside our own UI or reading-controls chrome
      }
      const main = startEl?.closest("[data-mn-scope]") as HTMLElement | null;
      if (!main) {
        setToolbar(null);
        return;
      }
      const selector = selectorFromRange(range, main);
      if (!selector) {
        setToolbar(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setToolbar(null);
        return;
      }
      // On /read each sutta is a <section id>; elsewhere the whole page is one key.
      const markSlug = startEl?.closest("section[id]")?.id ?? pageKey;
      setToolbar({ selector, rect, slug: markSlug });
    };

    const onPointerUp = (e: Event) => {
      if ((e.target as Element | null)?.closest?.("[data-mn-ui]")) return;
      setTimeout(evaluate, 0);
    };
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) setToolbar(null);
    };
    const onScroll = () => {
      setToolbar(null);
      setPopover(null);
    };

    document.addEventListener("mouseup", onPointerUp);
    document.addEventListener("touchend", onPointerUp);
    document.addEventListener("selectionchange", onSelectionChange);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mouseup", onPointerUp);
      document.removeEventListener("touchend", onPointerUp);
      document.removeEventListener("selectionchange", onSelectionChange);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pageKey]);

  /* ── clicking a painted mark → popover ────────────────────────────────── */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("mark[data-mark-id]");
      if (!el) return;
      const id = el.getAttribute("data-mark-id");
      if (!id || id === "__flash__") return;
      const mark = getMarks().find((m) => m.id === id);
      if (!mark) return;
      setPopover({ mark, rect: el.getBoundingClientRect() });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  /* close the popover on any outside click */
  useEffect(() => {
    if (!popover) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as Element | null)?.closest?.("[data-mn-popover]")) setPopover(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [popover]);

  /* ── deep link (?h=) — flash the shared passage ───────────────────────── */
  useEffect(() => {
    const enc = new URLSearchParams(window.location.search).get("h");
    if (!enc) return;
    const selector = decodeSelector(enc);
    if (!selector) return;
    const timer = setTimeout(() => {
      const main = scopeEl();
      if (!main) return;
      const range = rangeFromSelector(selector, main);
      if (!range) return;
      const painted = wrapRange(range, "dharma-mark-flash", { markId: "__flash__", markKind: "flash" });
      painted[0]?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => unwrapMark("__flash__"), 4200);
    }, 450);
    return () => clearTimeout(timer);
  }, [scopeEl]);

  /* ── helpers ──────────────────────────────────────────────────────────── */
  const clearSelection = () => window.getSelection()?.removeAllRanges();

  const afterCreate = useCallback(() => {
    requestPersistence();
    if (signedIn) return;
    let flag: string | null = null;
    try {
      flag = localStorage.getItem(PROMPT_KEY);
    } catch {}
    if (flag) return; // shown / dismissed / sent before — the panel off-ramp remains
    try {
      localStorage.setItem(PROMPT_KEY, "shown");
    } catch {}
    setSavePrompt(true);
  }, [signedIn]);

  const createMark = useCallback(
    (selector: AnnotationSelector, markSlug: string, note: string | null) => {
      add(
        newMark({
          slug: markSlug,
          locale,
          anchor: selector.anchor,
          quote: selector.quote,
          prefix: selector.prefix,
          suffix: selector.suffix,
          note,
          color: "amber",
        }),
      );
      showToast(note ? t.savedNote : t.savedHighlight);
      afterCreate();
    },
    [add, locale, showToast, afterCreate],
  );

  const onHighlight = () => {
    if (!toolbar) return;
    createMark(toolbar.selector, toolbar.slug, null);
    clearSelection();
    setToolbar(null);
  };
  const onNote = () => {
    if (!toolbar) return;
    setComposer({ kind: "new", selector: toolbar.selector, slug: toolbar.slug });
    setToolbar(null);
  };
  const onCopy = () => {
    if (!toolbar) return;
    navigator.clipboard?.writeText(toolbar.selector.quote).then(
      () => showToast(t.copiedPassage),
      () => showToast(t.errorGeneric),
    );
    clearSelection();
    setToolbar(null);
  };
  const onShare = () => {
    if (!toolbar) return;
    const url = `${window.location.origin}${window.location.pathname}?h=${encodeSelector(toolbar.selector)}`;
    setShare({ url, quote: toolbar.selector.quote, title: document.title || "Plain Dharma" });
    setToolbar(null);
  };

  const jump = useCallback((mark: MarginMark) => {
    setPanelOpen(false);
    const els = document.querySelectorAll<HTMLElement>(`mark[data-mark-id="${CSS.escape(mark.id)}"]`);
    if (!els.length) return;
    els.forEach((el) => {
      el.classList.add("dharma-flashing");
      setTimeout(() => el.classList.remove("dharma-flashing"), 1500);
    });
    els[0].scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const removeMark = useCallback(
    (id: string) => {
      unwrapMark(id);
      paintedRef.current.delete(id);
      remove(id);
      setPopover(null);
      showToast(t.removed);
    },
    [remove, showToast],
  );

  const onSendSignIn = useCallback(
    async (mail: string) => {
      const res = await signIn(mail);
      if (res.ok) {
        try {
          localStorage.setItem(PROMPT_KEY, "sent");
        } catch {}
      }
      return res;
    },
    [signIn],
  );

  /* ── positioning ──────────────────────────────────────────────────────── */
  const toolbarStyle = useMemo(() => {
    if (!toolbar) return undefined;
    const r = toolbar.rect;
    const above = r.top - 50;
    const top = above < NAV_H ? r.bottom + 8 : above;
    const left = Math.min(Math.max(r.left + r.width / 2, 150), window.innerWidth - 150);
    return { top, left } as const;
  }, [toolbar]);

  const popoverStyle = useMemo(() => {
    if (!popover) return undefined;
    const r = popover.rect;
    const above = r.top - 44;
    const top = above < NAV_H ? r.bottom + 6 : above;
    return { top, left: r.left + r.width / 2 } as const;
  }, [popover]);

  const stopMouseDown = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div data-mn-ui>
      {/* selection toolbar */}
      {toolbar && toolbarStyle && (
        <div
          className="fixed z-50 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-divider bg-paper/97 px-1 py-1 shadow-md backdrop-blur-sm"
          style={toolbarStyle}
          onMouseDown={stopMouseDown}
        >
          <ToolbarButton onClick={onHighlight} icon={<IconHighlight />} label={t.highlight} />
          <ToolbarButton onClick={onNote} icon={<IconNote />} label={t.note} />
          <ToolbarButton onClick={onCopy} icon={<IconCopy />} label={t.copy} />
          <ToolbarButton onClick={onShare} icon={<IconShare />} label={t.share} />
        </div>
      )}

      {/* mark popover */}
      {popover && popoverStyle && (
        <div
          data-mn-popover
          className="fixed z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-divider bg-paper/97 px-1.5 py-1 font-sans text-xs shadow-md backdrop-blur-sm"
          style={popoverStyle}
          onMouseDown={stopMouseDown}
        >
          <button
            type="button"
            className="rounded-full px-2.5 py-1 text-ink/75 hover:bg-accent/10 hover:text-accent"
            onClick={() => {
              setComposer({ kind: "edit", mark: popover.mark });
              setPopover(null);
            }}
          >
            {popover.mark.note ? t.editNote : t.addNote}
          </button>
          <button
            type="button"
            className="rounded-full px-2.5 py-1 text-ink/75 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => removeMark(popover.mark.id)}
          >
            {t.remove}
          </button>
        </div>
      )}

      {/* floating panel trigger — only once the reader has a mark on this page */}
      {pageMarks.length > 0 && (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          aria-label={t.panelTitle}
          className="fixed bottom-6 left-4 z-50 flex h-9 items-center gap-1.5 rounded-full border border-accent/40 bg-paper/95 px-3 text-accent shadow-sm backdrop-blur-sm transition-colors hover:border-accent hover:bg-paper sm:bottom-auto sm:top-20 sm:left-5"
        >
          <IconNote />
          <span className="font-sans text-xs font-medium">{pageMarks.length}</span>
        </button>
      )}

      {composer && (
        <NoteComposer
          quote={composer.kind === "new" ? composer.selector.quote : composer.mark.quote}
          initialNote={composer.kind === "edit" ? composer.mark.note ?? "" : ""}
          strings={t}
          onCancel={() => setComposer(null)}
          onSave={(note) => {
            if (composer.kind === "new") {
              createMark(composer.selector, composer.slug, note || null);
              clearSelection();
            } else {
              const id = composer.mark.id;
              unwrapMark(id);
              paintedRef.current.delete(id);
              updateNote(id, note || null);
              showToast(t.savedNote);
            }
            setComposer(null);
          }}
        />
      )}

      {share && (
        <ShareDialog
          url={share.url}
          quote={share.quote}
          title={share.title}
          strings={t}
          onClose={() => setShare(null)}
        />
      )}

      <MarginNotesPanel
        open={panelOpen}
        marks={pageMarks}
        signedIn={signedIn}
        email={email}
        strings={t}
        onClose={() => setPanelOpen(false)}
        onJump={jump}
        onRemove={removeMark}
        onEditNote={(mark) => setComposer({ kind: "edit", mark })}
        onSync={onSendSignIn}
        onSignOut={signOut}
      />

      {savePrompt && (
        <SavePrompt strings={t} onSend={onSendSignIn} onDismiss={() => setSavePrompt(false)} />
      )}

      {/* toast */}
      <div
        className={`pointer-events-none fixed bottom-6 left-1/2 z-[65] -translate-x-1/2 rounded-full border border-divider bg-paper/97 px-4 py-2 font-sans text-sm text-ink/80 shadow-md backdrop-blur-sm transition-opacity duration-200 ${
          toast ? "opacity-100" : "opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-sans text-xs text-ink/80 transition-colors hover:bg-accent/10 hover:text-accent"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
