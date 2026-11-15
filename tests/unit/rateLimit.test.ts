import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "crypto";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
    rateLimitBucket: {
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  clearPasswordAttempts,
  RateLimitError,
} from "@/lib/rateLimit";

describe("Shared PostgreSQL rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.$queryRaw as any).mockResolvedValue([{ count: 1 }]);
    (prisma.rateLimitBucket.deleteMany as any).mockResolvedValue({ count: 1 });
  });

  it("uses one atomic upsert statement for each request", async () => {
    await expect(
      consumeRateLimit("upload:hashed-client-ip", 10, 60_000),
    ).resolves.toBeUndefined();

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    const [template, storedKey] = (prisma.$queryRaw as any).mock.calls[0];
    expect(String(template.join(" "))).toContain('ON CONFLICT ("key") DO UPDATE');
    expect(String(template.join(" "))).toContain('RETURNING "count"');
    expect(storedKey).toBe(
      createHash("sha256").update("upload:hashed-client-ip").digest("hex"),
    );
    expect(storedKey).not.toBe("upload:hashed-client-ip");
  });

  it("rejects a full bucket when the atomic statement returns no row", async () => {
    (prisma.$queryRaw as any).mockResolvedValueOnce([]);

    await expect(
      consumeRateLimit("share-post:client", 60, 60_000),
    ).rejects.toBeInstanceOf(RateLimitError);
  });

  it("rejects invalid limits instead of silently disabling throttling", async () => {
    await expect(consumeRateLimit("invalid", 0, 60_000)).rejects.toThrow(
      "Invalid rate limit configuration",
    );
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it("clears only the hashed password bucket after a successful check", async () => {
    await clearPasswordAttempts("pwd-fail:client:share-123");

    expect(prisma.rateLimitBucket.deleteMany).toHaveBeenCalledWith({
      where: {
        key: createHash("sha256")
          .update("pwd-fail:client:share-123")
          .digest("hex"),
      },
    });
  });
});
