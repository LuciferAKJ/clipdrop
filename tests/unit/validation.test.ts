import { describe, it, expect } from "vitest";
import { validateDeviceName, validateClipboardSync } from "@/lib/validation";

describe("validateDeviceName", () => {
  it("accepts a normal name", () => {
    expect(() => validateDeviceName("My Laptop")).not.toThrow();
  });

  it("rejects empty or whitespace-only names", () => {
    expect(() => validateDeviceName("")).toThrow();
    expect(() => validateDeviceName("   ")).toThrow();
  });

  it("rejects non-string input", () => {
    expect(() => validateDeviceName(123 as unknown as string)).toThrow();
    expect(() => validateDeviceName(null as unknown as string)).toThrow();
  });

  it("rejects names over the max length", () => {
    expect(() => validateDeviceName("a".repeat(101))).toThrow();
  });

  it("accepts a name at exactly the max length", () => {
    expect(() => validateDeviceName("a".repeat(100))).not.toThrow();
  });
});

describe("validateClipboardSync", () => {
  it("accepts a valid TEXT payload", () => {
    expect(() =>
      validateClipboardSync("TEXT", "hello world", undefined),
    ).not.toThrow();
  });

  it("accepts a valid SHARE payload", () => {
    expect(() =>
      validateClipboardSync("SHARE", undefined, "share_123"),
    ).not.toThrow();
  });

  it("rejects an invalid contentType", () => {
    expect(() => validateClipboardSync("FILE", "x", undefined)).toThrow();
    expect(() => validateClipboardSync(undefined, "x", undefined)).toThrow();
  });

  it("rejects TEXT with missing textContent", () => {
    expect(() => validateClipboardSync("TEXT", undefined, undefined)).toThrow();
    expect(() => validateClipboardSync("TEXT", "   ", undefined)).toThrow();
  });

  it("rejects TEXT with oversized textContent", () => {
    expect(() =>
      validateClipboardSync("TEXT", "a".repeat(50_001), undefined),
    ).toThrow();
  });

  it("rejects SHARE with missing shareId", () => {
    expect(() =>
      validateClipboardSync("SHARE", undefined, undefined),
    ).toThrow();
    expect(() => validateClipboardSync("SHARE", undefined, "  ")).toThrow();
  });

  it("rejects malformed non-string values", () => {
    expect(() => validateClipboardSync("TEXT", 123, undefined)).toThrow();
    expect(() => validateClipboardSync("SHARE", undefined, 456)).toThrow();
  });
});
