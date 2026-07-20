"use client";
import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { readClipboard, writeClipboard } from "@/lib/clipboardWatcher";
import { pushClipboard, pullClipboard } from "@/lib/clipboardSyncClient";
import { isDocumentVisible } from "@/lib/syncVisibility";
import { isClipboardEqual, isRemoteNewer } from "@/lib/clipboardCompare";
import { useClipboardSyncStatusWriter } from "@/components/providers/ClipboardSyncStatusProvider";

const POLL_INTERVAL_MS = 3000;

/**
 * Polling-based clipboard sync engine, TEXT-only. Conflict rule: the
 * newest server-side updatedAt always wins — no merge, no prompts. If
 * two devices race, whichever push lands last on the server is what
 * every device converges to on their next successful pull; a losing
 * device's own earlier push is simply superseded, never retried or
 * reconciled. On error, no immediate retry is attempted — the next
 * regularly scheduled 3s tick is the only recovery path.
 */
export function useClipboardSync() {
  const { isSignedIn, isLoaded } = useUser();
  const { setStatus, setLastSyncedAt } = useClipboardSyncStatusWriter();

  const lastLocalClipboard = useRef<string | null>(null);
  const lastPushedClipboard = useRef<string | null>(null);
  const lastServerUpdatedAt = useRef<string | null>(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let cancelled = false;

    async function tick() {
      if (!isDocumentVisible()) return;
      if (syncingRef.current) return;

      syncingRef.current = true;
      try {
        const localText = await readClipboard();

        const hasLocalChange =
          !!localText &&
          localText.trim().length > 0 &&
          !isClipboardEqual(localText, lastLocalClipboard.current);

        if (hasLocalChange) {
          const alreadyPushed = isClipboardEqual(
            localText,
            lastPushedClipboard.current,
          );
          lastLocalClipboard.current = localText as string;

          if (!alreadyPushed) {
            setStatus("pushing");
            try {
              const state = await pushClipboard({
                contentType: "TEXT",
                textContent: localText as string,
              });
              lastPushedClipboard.current = localText as string;
              lastServerUpdatedAt.current = state.updatedAt;
              setLastSyncedAt(state.updatedAt);
              setStatus("idle");
            } catch {
              // Do not retry immediately — leave lastPushedClipboard
              // unset for this value so the *next scheduled* tick
              // retries the push naturally.
              setStatus("error");
            }
          }
          return; // don't also pull in the same tick
        }

        setStatus("pulling");
        let remote;
        try {
          remote = await pullClipboard();
        } catch {
          setStatus("error");
          return; // recover on next scheduled cycle, no immediate retry
        }

        if (!remote) {
          setStatus("idle");
          return;
        }
        if (remote.contentType !== "TEXT" || !remote.textContent) {
          setStatus("idle");
          return;
        }

        // Conflict resolution: newest server timestamp always wins.
        const isNewer = isRemoteNewer(
          remote.updatedAt,
          lastServerUpdatedAt.current,
        );
        if (!isNewer) {
          setStatus("idle");
          return;
        }

        const differsLocally = !isClipboardEqual(
          remote.textContent,
          lastLocalClipboard.current,
        );

        if (differsLocally) {
          setStatus("syncing");
          const wrote = await writeClipboard(remote.textContent);
          if (wrote) {
            lastLocalClipboard.current = remote.textContent;
            lastPushedClipboard.current = remote.textContent; // don't re-push what we just applied
          }
        }

        lastServerUpdatedAt.current = remote.updatedAt;
        setLastSyncedAt(remote.updatedAt);
        setStatus("idle");
      } finally {
        syncingRef.current = false;
      }
    }

    const intervalId = setInterval(() => {
      if (!cancelled) tick();
    }, POLL_INTERVAL_MS);

    function handleVisibilityChange() {
      if (isDocumentVisible() && !cancelled) {
        tick();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    tick();

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoaded, isSignedIn, setStatus, setLastSyncedAt]);
}
