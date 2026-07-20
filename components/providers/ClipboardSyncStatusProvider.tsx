"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type SyncStatus = "idle" | "pulling" | "pushing" | "syncing" | "error";

interface StatusReadValue {
  status: SyncStatus;
  lastSyncedAt: string | null;
}

interface StatusWriteValue {
  setStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (timestamp: string) => void;
}

const ReadContext = createContext<StatusReadValue>({
  status: "idle",
  lastSyncedAt: null,
});

// Write access is intentionally a separate context, not exported via
// hooks/useClipboardSyncStatus.ts — that public hook only ever sees
// ReadContext, so external consumers genuinely cannot set status.
const WriteContext = createContext<StatusWriteValue>({
  setStatus: () => {},
  setLastSyncedAt: () => {},
});

export function ClipboardSyncStatusProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [status, setStatusState] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAtState] = useState<string | null>(null);

  const setStatus = useCallback((s: SyncStatus) => setStatusState(s), []);
  const setLastSyncedAt = useCallback(
    (ts: string) => setLastSyncedAtState(ts),
    [],
  );

  return (
    <ReadContext.Provider value={{ status, lastSyncedAt }}>
      <WriteContext.Provider value={{ setStatus, setLastSyncedAt }}>
        {children}
      </WriteContext.Provider>
    </ReadContext.Provider>
  );
}

/** Internal — consumed only by useClipboardSync to report status. */
export function useClipboardSyncStatusWriter(): StatusWriteValue {
  return useContext(WriteContext);
}

/** Internal — wrapped by the public hooks/useClipboardSyncStatus.ts. */
export function useClipboardSyncStatusContext(): StatusReadValue {
  return useContext(ReadContext);
}
