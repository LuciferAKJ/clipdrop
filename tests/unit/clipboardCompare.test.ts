import { describe, it, expect } from "vitest";
import { isClipboardEqual, isRemoteNewer } from "@/lib/clipboardCompare";

describe("isClipboardEqual", () => {
  it("returns true for identical strings", () => {
    expect(isClipboardEqual("hello", "hello")).toBe(true);
  });

  it("trims whitespace before comparing", () => {
    expect(isClipboardEqual("  hello  ", "hello")).toBe(true);
    expect(isClipboardEqual("hello\n", "hello")).toBe(true);
  });

  it("returns false for genuinely different content", () => {
    expect(isClipboardEqual("hello", "world")).toBe(false);
  });

  it("treats null and undefined as empty string", () => {
    expect(isClipboardEqual(null, undefined)).toBe(true);
    expect(isClipboardEqual(null, "")).toBe(true);
    expect(isClipboardEqual(undefined, "  ")).toBe(true);
  });

  it("distinguishes empty from non-empty", () => {
    expect(isClipboardEqual(null, "hello")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(isClipboardEqual("Hello", "hello")).toBe(false);
  });
});

describe("isRemoteNewer", () => {
  it("returns true when there is no prior known timestamp", () => {
    expect(isRemoteNewer("2026-01-01T00:00:00.000Z", null)).toBe(true);
  });

  it("returns true when remote timestamp is later", () => {
    expect(
      isRemoteNewer("2026-01-02T00:00:00.000Z", "2026-01-01T00:00:00.000Z"),
    ).toBe(true);
  });

  it("returns false when remote timestamp is earlier", () => {
    expect(
      isRemoteNewer("2026-01-01T00:00:00.000Z", "2026-01-02T00:00:00.000Z"),
    ).toBe(false);
  });

  it("returns false when timestamps are identical", () => {
    const ts = "2026-01-01T00:00:00.000Z";
    expect(isRemoteNewer(ts, ts)).toBe(false);
  });
});
