import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import {
  ClipboardSyncStatusProvider,
  useClipboardSyncStatusContext,
  useClipboardSyncStatusWriter,
} from "@/components/providers/ClipboardSyncStatusProvider";

function Probe() {
  const { status, lastSyncedAt } = useClipboardSyncStatusContext();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="lastSyncedAt">{lastSyncedAt ?? "none"}</span>
    </div>
  );
}

function Trigger() {
  const { setStatus, setLastSyncedAt } = useClipboardSyncStatusWriter();
  return (
    <button
      data-testid="trigger"
      onClick={() => {
        setStatus("syncing");
        setLastSyncedAt("2026-07-19T00:00:00.000Z");
      }}
    >
      trigger
    </button>
  );
}

describe("ClipboardSyncStatusProvider", () => {
  it("provides default state of idle / null", () => {
    render(
      <ClipboardSyncStatusProvider>
        <Probe />
      </ClipboardSyncStatusProvider>,
    );
    expect(screen.getByTestId("status").textContent).toBe("idle");
    expect(screen.getByTestId("lastSyncedAt").textContent).toBe("none");
  });

  it("updates status and lastSyncedAt when the writer is used", () => {
    render(
      <ClipboardSyncStatusProvider>
        <Probe />
        <Trigger />
      </ClipboardSyncStatusProvider>,
    );

    act(() => {
      screen.getByTestId("trigger").click();
    });

    expect(screen.getByTestId("status").textContent).toBe("syncing");
    expect(screen.getByTestId("lastSyncedAt").textContent).toBe(
      "2026-07-19T00:00:00.000Z",
    );
  });
});
