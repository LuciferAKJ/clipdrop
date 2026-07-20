import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

const useClipboardSyncMock = vi.fn();

vi.mock("@/hooks/useClipboardSync", () => ({
  useClipboardSync: () => useClipboardSyncMock(),
}));

// useClipboardSync itself calls useUser() — mock Clerk so importing the
// real hook (if the mock above weren't in place) wouldn't blow up, and
// so any nested component relying on Clerk context doesn't crash.
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isSignedIn: true, isLoaded: true }),
}));

import { ClipboardSyncProvider } from "@/components/providers/ClipboardSyncProvider";

describe("ClipboardSyncProvider", () => {
  it("mounts without throwing", () => {
    expect(() => render(<ClipboardSyncProvider />)).not.toThrow();
  });

  it("renders nothing visible", () => {
    const { container } = render(<ClipboardSyncProvider />);
    expect(container).toBeEmptyDOMElement();
  });

  it("initializes the synchronization hook", () => {
    render(<ClipboardSyncProvider />);
    expect(useClipboardSyncMock).toHaveBeenCalled();
  });
});
