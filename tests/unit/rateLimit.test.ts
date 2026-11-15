import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "crypto";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    rateLimitBucket: {
      createMany: vi.fn(),
      updateMany: vi.fn(),
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
    (prisma.rateLimitBucket.createMany as any).mockResolvedValue({ count: 1 });
    // First updateMany resets an expired bucket; the second consumes a request.
    (prisma.rateLimitBucket.updateMany as any).mockResolvedValue({ count: 1 });
    (prisma.rateLimitBucket.deleteMany as any).mockResolvedValue({ count: 1 });
  });

  it("initializes a hashed bucket and admits a request with a conditional increment", async () => {
    await expect(
      consumeRateLimit("upload:hashed-client-ip", 10, 60_000),
    ).resolves.toBeUndefined();

    const storedKey = createHash("sha256")
      .update("upload:hashed-client-ip")
      .digest("hex");

    expect(prisma.rateLimitBucket.createMany).toHaveBeenCalledWith({
      data: [
        {
          key: storedKey,
          count: 0,
          resetAt: expect.any(Date),
        },
      ],
      skipDuplicates: true,
    });
    expect(prisma.rateLimitBucket.updateMany).toHaveBeenCalledTimes(2);
    expect(prisma.rateLimitBucket.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        key: storedKey,
        resetAt: { lte: expect.any(Date) },
      },
      data: {
        count: 0,
        resetAt: expect.any(Date),
      },
    });
    expect(prisma.rateLimitBucket.updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        key: storedKey,
        resetAt: { gt: expect.any(Date) },
        count: { lt: 10 },
      },
      data: {
        count: { increment: 1 },
      },
    });
    expect(storedKey).not.toBe("upload:hashed-client-ip");
  });

  it("admits no more than the configured maximum under concurrent requests", async () => {
    const max = 3;
    let admitted = 0;

    (prisma.rateLimitBucket.updateMany as any).mockImplementation(
      async ({ where }: any) => {
        // No existing row has expired, so do not reset the window.
        if (where.resetAt?.lte) return { count: 0 };

        // Simulate PostgreSQL's atomic conditional UPDATE:
        // only max requests can match count < max.
        if (admitted < max) {
          admitted += 1;
          return { count: 1 };
        }
        return { count: 0 };
      },
    );

    const results = await Promise.allSettled(
      Array.from({ length: 12 }, () =>
        consumeRateLimit("concurrent-client", max, 60_000),
      ),
    );

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(max);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(12 - max);
    expect(admitted).toBe(max);
  });

  it("rejects a full bucket when the conditional increment matches no row", async () => {
    (prisma.rateLimitBucket.updateMany as any)
      .mockResolvedValueOnce({ count: 0 }) // no expired row to reset
      .mockResolvedValueOnce({ count: 0 }); // count already at max

    await expect(
      consumeRateLimit("share-post:client", 60, 60_000),
    ).rejects.toBeInstanceOf(RateLimitError);
  });

  it("resets an expired bucket before attempting the increment", async () => {
    (prisma.rateLimitBucket.updateMany as any)
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });

    await consumeRateLimit("share-get:client", 60, 60_000);

    expect(prisma.rateLimitBucket.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          resetAt: { lte: expect.any(Date) },
        }),
        data: expect.objectContaining({
          count: 0,
          resetAt: expect.any(Date),
        }),
      }),
    );
  });

  it("rejects invalid limits instead of silently disabling throttling", async () => {
    await expect(consumeRateLimit("invalid", 0, 60_000)).rejects.toThrow(
      "Invalid rate limit configuration",
    );
    expect(prisma.rateLimitBucket.createMany).not.toHaveBeenCalled();
    expect(prisma.rateLimitBucket.updateMany).not.toHaveBeenCalled();
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
