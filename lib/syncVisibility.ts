/**
 * Pure browser visibility/focus readers. No React, no polling, no
 * side effects — callers (useClipboardSync) own the event listeners
 * and timing; this module just answers "what's the state right now."
 */

export function isDocumentVisible(): boolean {
  if (typeof document === "undefined") return false;
  return document.visibilityState === "visible";
}

export function isWindowFocused(): boolean {
  if (typeof document === "undefined") return false;
  return document.hasFocus();
}
