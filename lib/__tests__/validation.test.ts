import { describe, it, expect } from "vitest";
import { validateTextShare, validateFile, MAX_TEXT_LENGTH } from "@/lib/validation";

describe("validateTextShare", () => {
  it("rejects empty text", () => {
    expect(() => validateTextShare("")).toThrow();
    expect(() => validateTextShare("   ")).toThrow();
  });

  it("rejects text over max length", () => {
    expect(() => validateTextShare("a".repeat(MAX_TEXT_LENGTH + 1))).toThrow();
  });

  it("accepts valid text", () => {
    expect(() => validateTextShare("hello")).not.toThrow();
  });
});

describe("validateFile", () => {
  function makeFile(size: number, type: string) {
    return { size, type } as File;
  }

  it("rejects oversized files", () => {
    expect(() => validateFile(makeFile(11 * 1024 * 1024, "image/png"))).toThrow();
  });

  it("rejects disallowed mime types", () => {
    expect(() => validateFile(makeFile(1000, "application/x-msdownload"))).toThrow();
  });

  it("accepts allowed types under size limit", () => {
    expect(() => validateFile(makeFile(1000, "image/png"))).not.toThrow();
  });
});