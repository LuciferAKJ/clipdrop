import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  ClipboardSyncStatusProvider,
  useClipboardSyncStatusWriter,
} from "@/components/providers/ClipboardSyncStatusProvider";
import { useClipboardSyncStatus } from "@/hooks/useClipboardSyncStatus";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <ClipboardSyncStatusProvider>{children}</ClipboardSyncStatusProvider>;
}

describe("useClipboardSyncStatus", () => {
  it("defaults to idle with no lastSyncedAt", () => {
    const { result } = renderHook(() => useClipboardSyncStatus(), { wrapper });
    expect(result.current.status).toBe("idle");
    expect(result.current.lastSyncedAt).toBeNull();
  });

  it("reflects status updates made via the internal writer", () => {
    const { result } = renderHook(
      () => ({
        read: useClipboardSyncStatus(),
        write: useClipboardSyncStatusWriter(),
      }),
      { wrapper },
    );

    act(() => {
      result.current.write.setStatus("pushing");
    });

    expect(result.current.read.status).toBe("pushing");
  });

  it("reflects lastSyncedAt updates", () => {
    const { result } = renderHook(
      () => ({
        read: useClipboardSyncStatus(),
        write: useClipboardSyncStatusWriter(),
      }),
      { wrapper },
    );

    const ts = "2026-07-19T12:00:00.000Z";
    act(() => {
      result.current.write.setLastSyncedAt(ts);
    });

    expect(result.current.read.lastSyncedAt).toBe(ts);
  });

  it("exposes no setter functions on the public hook (read-only contract)", () => {
    const { result } = renderHook(() => useClipboardSyncStatus(), { wrapper });
    expect((result.current as any).setStatus).toBeUndefined();
    expect((result.current as any).setLastSyncedAt).toBeUndefined();
  });

  it("falls back to default idle state when used outside a provider", () => {
    const { result } = renderHook(() => useClipboardSyncStatus());
    expect(result.current.status).toBe("idle");
    expect(result.current.lastSyncedAt).toBeNull();
  });
});
