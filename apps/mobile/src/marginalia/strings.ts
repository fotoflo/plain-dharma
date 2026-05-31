/**
 * UI copy for Margin Notes on mobile — ported from the web's
 * `src/components/marginalia/strings.ts` so microcopy stays in lockstep across
 * surfaces. Values are intentionally byte-identical to the web's English
 * strings where a string exists on both platforms; a few mobile-only strings
 * (long-press hints, "Send magic link", share-sheet labels) are added below the
 * shared block and clearly marked.
 *
 * Kept as a plain object rather than pulled into @plain-dharma/content: the
 * shared package is content metadata, not UI chrome, and the web file carries a
 * note that it deliberately lives with the feature. Mirroring here keeps the web
 * build untouched while still giving mobile a single source for its copy.
 */

export const MARGINALIA_STRINGS = {
  // toolbar / actions
  highlight: "Highlight",
  note: "Note",
  copy: "Copy",
  copied: "Copied",
  share: "Share",

  // mark actions
  addNote: "Add note",
  editNote: "Edit note",
  remove: "Remove",

  // note composer
  noteTitle: "Margin note",
  notePlaceholder: "your private note…",
  // Mobile note field doubles as the highlight affordance, so it spells out the
  // empty-note behaviour the web surfaces through a separate toolbar button.
  notePlaceholderMobile: "your private note… (leave empty to just highlight)",
  save: "Save",
  cancel: "Cancel",

  // panel
  panelTitle: "Margin Notes",
  panelEmpty: "No margin notes yet.",
  // Mobile creates marks by long-press rather than text selection.
  panelEmptyHint: "Long-press a passage to highlight it or add a private note.",
  noteless: "highlight",

  // share dialog
  shareTitle: "Share this passage",
  shareIntro: "A link that opens the sutta and gently lands on this passage.",
  copyLink: "Copy link",
  copyPassage: "Copy passage",
  shareNative: "Share…",
  close: "Close",

  // sign-in nudge (SavePrompt parity)
  savePromptTitle: "Want to keep this?",
  savePromptBody:
    "Your notes are saved on this device for now. Add your email and we’ll send a one-tap link so they stay with you for good — on your phone, your laptop, and on plaindharma.com.",
  savePromptReassure: "Only for your notes. No list, no spam.",
  savePromptSend: "Send link",
  savePromptDismiss: "Not now",
  savePromptSentTitle: "Check your inbox",
  savePromptSentBody:
    "We sent a one-tap link to keep your margin notes. Open it on this device and they’ll follow you here and on the web.",
  emailPlaceholder: "you@example.com",

  // sync / account
  syncKeep: "Keep these safe across devices",
  // Mobile-only: the More-tab sign-in pitch + button label.
  signInPitch:
    "Sign in to sync your highlights & notes across this app and the web. Only for your notes — no list, no spam.",
  sendMagicLink: "Send magic link",
  sending: "Sending…",
  signedInAs: "Synced",
  signOut: "Sign out",

  // color picker (mobile-only label)
  colorLabel: "Highlight color",

  // toasts
  savedHighlight: "Highlighted",
  savedNote: "Note saved",
  removed: "Removed",
  copiedPassage: "Passage copied",
  copiedLink: "Link copied",
  errorGeneric: "Something went wrong — try again.",
  errorEmail: "Enter a valid email address.",
} as const;

export type MarginaliaStrings = typeof MARGINALIA_STRINGS;
