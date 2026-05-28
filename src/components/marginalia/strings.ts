/**
 * UI copy for Margin Notes. Kept here (not src/content/strings.ts) so the
 * feature's strings travel with the feature — and to stay out of a file a
 * concurrent OG/locale pass is editing. English-first; structured so a locale
 * map can be added later without touching call sites.
 */

export interface MarginaliaStrings {
  // toolbar
  highlight: string;
  note: string;
  copy: string;
  copied: string;
  share: string;
  // mark popover
  addNote: string;
  editNote: string;
  remove: string;
  // note composer
  noteTitle: string;
  notePlaceholder: string;
  save: string;
  cancel: string;
  // panel
  panelTitle: string;
  panelEmpty: string;
  panelEmptyHint: string;
  jumpHint: string;
  noteless: string;
  // share dialog
  shareTitle: string;
  shareIntro: string;
  previewLabel: string;
  copyLink: string;
  copyPassage: string;
  shareNative: string;
  close: string;
  // save prompt
  savePromptTitle: string;
  savePromptBody: string;
  savePromptReassure: string;
  savePromptSend: string;
  savePromptDismiss: string;
  savePromptSentTitle: string;
  savePromptSentBody: string;
  emailPlaceholder: string;
  // sync / account
  syncKeep: string;
  signedInAs: string;
  signOut: string;
  // toasts
  savedHighlight: string;
  savedNote: string;
  removed: string;
  copiedPassage: string;
  errorGeneric: string;
}

export const MARGINALIA_STRINGS: MarginaliaStrings = {
  highlight: "Highlight",
  note: "Note",
  copy: "Copy",
  copied: "Copied",
  share: "Share",

  addNote: "Add note",
  editNote: "Edit note",
  remove: "Remove",

  noteTitle: "Margin note",
  notePlaceholder: "your private note…",
  save: "Save",
  cancel: "Cancel",

  panelTitle: "Margin Notes",
  panelEmpty: "No margin notes yet.",
  panelEmptyHint: "Select any passage to highlight it or add a private note.",
  jumpHint: "tap to jump",
  noteless: "highlight",

  shareTitle: "Share this passage",
  shareIntro: "A link that opens the sutta and gently lands on this passage.",
  previewLabel: "Link preview",
  copyLink: "Copy link",
  copyPassage: "Copy passage",
  shareNative: "Share…",
  close: "Close",

  savePromptTitle: "Want to keep this?",
  savePromptBody:
    "Your notes are saved in this browser for now. Add your email and we’ll send a one-tap link so they stay with you for good — on your phone, your laptop, and in the Plain Dharma app.",
  savePromptReassure: "Only for your notes. No list, no spam.",
  savePromptSend: "Send link",
  savePromptDismiss: "Not now",
  savePromptSentTitle: "Check your inbox",
  savePromptSentBody:
    "We sent a one-tap link to keep your margin notes. Open it on any device and they’ll follow you there.",
  emailPlaceholder: "you@example.com",

  syncKeep: "Keep these safe across devices",
  signedInAs: "Synced",
  signOut: "Sign out",

  savedHighlight: "Highlighted",
  savedNote: "Note saved",
  removed: "Removed",
  copiedPassage: "Passage copied",
  errorGeneric: "Something went wrong — try again.",
};
