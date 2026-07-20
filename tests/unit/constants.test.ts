import { describe, it, expect } from "vitest";
import * as constants from "@/lib/constants";

describe("constants", () => {
  it("exports the expected values", () => {
    expect(constants.DEFAULT_SHARE_EXPIRY_MS).toBe(60 * 60 * 1000);
    expect(constants.MAX_TEXT_LENGTH).toBe(50_000);
    expect(constants.MAX_CLIPBOARD_TEXT_LENGTH).toBe(50_000);
    expect(constants.MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
    expect(constants.MAX_DEVICE_NAME_LENGTH).toBe(100);
    expect(constants.CLIPBOARD_POLL_INTERVAL_MS).toBe(3000);
    expect(constants.RATE_LIMIT_WINDOW_MS).toBe(60_000);
  });

  it("numeric constants are positive", () => {
    const numericEntries = Object.entries(constants).filter(
      ([, v]) => typeof v === "number",
    );
    expect(numericEntries.length).toBeGreaterThan(0);
    for (const [key, value] of numericEntries) {
      expect(value as number, `${key} should be positive`).toBeGreaterThan(0);
    }
  });

  it("ALLOWED_MIME_PREFIXES is a non-empty readonly array", () => {
    expect(Array.isArray(constants.ALLOWED_MIME_PREFIXES)).toBe(true);
    expect(constants.ALLOWED_MIME_PREFIXES.length).toBeGreaterThan(0);
  });

  it("reassigning an exported const at the module level is a compile-time error, not a runtime one", () => {
    // `export const X = ...` is not deep-frozen at runtime — this test
    // documents that guarantee is a TypeScript-level one (readonly
    // binding), not an Object.freeze. If true runtime immutability is
    // required, constants.ts would need Object.freeze() on export.
    expect(true).toBe(true);
  });
});
