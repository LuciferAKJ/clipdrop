import { describe, it, expect, vi } from "vitest";
import { generateUniqueCode } from "@/lib/codeGen";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: { share: { findUnique: vi.fn() } },
}));

describe("generateUniqueCode", () => {
  it("returns a 6-char code when no collision", async () => {
    (prisma.share.findUnique as any).mockResolvedValue(null);
    const code = await generateUniqueCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it("retries on collision then succeeds", async () => {
    (prisma.share.findUnique as any)
      .mockResolvedValueOnce({ id: "existing" })
      .mockResolvedValueOnce(null);
    const code = await generateUniqueCode();
    expect(code).toHaveLength(6);
  });

  it("throws after exhausting retries", async () => {
    (prisma.share.findUnique as any).mockResolvedValue({ id: "existing" });
    await expect(generateUniqueCode()).rejects.toThrow();
  });
});