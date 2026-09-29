import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    share: {
      count: vi.fn(),
    },
  },
}));

import { getClientIp, hashIp } from "@/lib/ipHash";
import { checkRateLimit, RateLimitError } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";

describe("lib/ipHash & rate limiting spoofing protections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prioritizes x-real-ip from Vercel edge and ignores spoofed x-forwarded-for headers", () => {
    const req = new NextRequest("http://localhost/api/upload", {
      headers: {
        "x-real-ip": "203.0.113.195",
        "x-forwarded-for": "198.51.100.1, 10.0.0.1",
      },
    });

    const ip = getClientIp(req);
    expect(ip).toBe("203.0.113.195");
  });

  it("uses x-vercel-proxied-for if x-real-ip is not present", () => {
    const req = new NextRequest("http://localhost/api/upload", {
      headers: {
        "x-vercel-proxied-for": "198.51.100.50",
      },
    });

    const ip = getClientIp(req);
    expect(ip).toBe("198.51.100.50");
  });

  it("falls back to x-forwarded-for when running behind generic reverse proxy", () => {
    const req = new NextRequest("http://localhost/api/upload", {
      headers: {
        "x-forwarded-for": "192.0.2.1",
      },
    });

    const ip = getClientIp(req);
    expect(ip).toBe("192.0.2.1");
  });

  it("returns 'unknown' when no proxy headers exist", () => {
    const req = new NextRequest("http://localhost/api/upload");
    const ip = getClientIp(req);
    expect(ip).toBe("unknown");
  });

  it("enforces rate limits on unknown IPs instead of bypassing", async () => {
    const unknownHash = hashIp("unknown");
    (prisma.share.count as any).mockResolvedValue(10); // at limit

    await expect(checkRateLimit(unknownHash)).rejects.toThrow(RateLimitError);
    expect(prisma.share.count).toHaveBeenCalledWith({
      where: {
        ipHash: unknownHash,
        createdAt: {
          gte: expect.any(Date),
        },
      },
    });
  });

  it("allows uploads below the rate limit threshold", async () => {
    const ipHash = hashIp("203.0.113.10");
    (prisma.share.count as any).mockResolvedValue(5); // below 10

    await expect(checkRateLimit(ipHash)).resolves.not.toThrow();
  });
});
