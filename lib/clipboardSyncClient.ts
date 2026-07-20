import { withClientIdHeader } from "@/lib/deviceClient";
import type { ClipboardPayload, ClipboardState } from "@/lib/types/clipboard";

/**
 * Pushes a new clipboard value for the current user. No polling, no
 * retry loop, no hook wiring here — this is a single fire-and-await
 * request, intended to be called by a future UI/hook layer (Stage 5+).
 */
export async function pushClipboard(
  payload: ClipboardPayload,
): Promise<ClipboardState> {
  const res = await fetch("/api/clipboard", {
    method: "PUT",
    headers: withClientIdHeader({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to push clipboard");
  }

  return res.json();
}

/**
 * Pulls the current clipboard value for the current user.
 * Returns null when no clipboard has been set yet (server responds 204).
 */
export async function pullClipboard(): Promise<ClipboardState | null> {
  const res = await fetch("/api/clipboard", {
    method: "GET",
    headers: withClientIdHeader(),
  });

  if (res.status === 204) {
    return null;
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to pull clipboard");
  }

  return res.json();
}
