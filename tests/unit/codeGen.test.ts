import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    share: {
      findUnique: vi.fn(),
    },
  },
}));

import { generateUniqueCode } from "@/lib/codeGen";
import { prisma } from "@/lib/prisma";

describe("generateUniqueCode (cryptographic)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a 6-character code by default from the expected alphabet", async () => {
    (prisma.share.findUnique as any).mockResolvedValue(null);

    const code = await generateUniqueCode();
    expect(code).toHaveLength(6);
    // Alphabet: ABCDEFGHJKLMNPQRSTUVWXYZ23456789
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it("supports custom code length", async () => {
    (prisma.share.findUnique as any).mockResolvedValue(null);

    const code = await generateUniqueCode(8);
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
  });

  it("retries on code collision and returns a new unique code", async () => {
    // First attempt collides, second attempt is unique
    (prisma.share.findUnique as any)
      .mockResolvedValueOnce({ id: "existing-share", code: "COLLID" })
      .mockResolvedValueOnce(null);

    const code = await generateUniqueCode();
    expect(code).toBeDefined();
    expect(prisma.share.findUnique).toHaveBeenCalledTimes(2);
  });

  it("throws after 5 consecutive collisions", async () => {
    (prisma.share.findUnique as any).mockResolvedValue({
      id: "existing-share",
    });

    await expect(generateUniqueCode()).rejects.toThrow(
      "Failed to generate unique code",
    );
    expect(prisma.share.findUnique).toHaveBeenCalledTimes(5);
  });
});
