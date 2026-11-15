import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
    rateLimitBucket: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
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

  it("uses IP_HASH_PEPPER as a keyed HMAC secret", () => {
    const previousPepper = process.env.IP_HASH_PEPPER;
    try {
      process.env.IP_HASH_PEPPER = "test-pepper-one-with-at-least-32-characters";
      const first = hashIp("203.0.113.10");
      process.env.IP_HASH_PEPPER = "test-pepper-two-with-at-least-32-characters";
      const second = hashIp("203.0.113.10");
      expect(first).not.toBe(second);
      expect(first).not.toContain("203.0.113.10");
    } finally {
      if (previousPepper === undefined) delete process.env.IP_HASH_PEPPER;
      else process.env.IP_HASH_PEPPER = previousPepper;
    }
  });

  it("rejects a short production IP hash pepper", () => {
    const previousPepper = process.env.IP_HASH_PEPPER;
    const previousMode = process.env.NODE_ENV;
    try {
      process.env.IP_HASH_PEPPER = "too-short";
      process.env.NODE_ENV = "production";
      expect(() => hashIp("203.0.113.10")).toThrow(
        "IP_HASH_PEPPER must be configured in production with at least 32 characters",
      );
    } finally {
      if (previousPepper === undefined) delete (process.env as any).IP_HASH_PEPPER;
      else (process.env as any).IP_HASH_PEPPER = previousPepper;
      if (previousMode === undefined) delete (process.env as any).NODE_ENV;
      else (process.env as any).NODE_ENV = previousMode;
    }
  });

  it("fails closed in production when IP_HASH_PEPPER is missing", () => {
    const previousPepper = process.env.IP_HASH_PEPPER;
    const previousMode = process.env.NODE_ENV;
    try {
      delete (process.env as any).IP_HASH_PEPPER;
      (process.env as any).NODE_ENV = "production";
      expect(() => hashIp("203.0.113.10")).toThrow(
        "IP_HASH_PEPPER must be configured in production with at least 32 characters",
      );
    } finally {
      if (previousPepper === undefined) delete (process.env as any).IP_HASH_PEPPER;
      else (process.env as any).IP_HASH_PEPPER = previousPepper;
      if (previousMode === undefined) delete (process.env as any).NODE_ENV;
      else (process.env as any).NODE_ENV = previousMode;
    }
  });

  it("returns 'unknown' when no proxy headers exist", () => {
    const req = new NextRequest("http://localhost/api/upload");
    const ip = getClientIp(req);
    expect(ip).toBe("unknown");
  });

  it("enforces rate limits on unknown IPs instead of bypassing", async () => {
    const unknownHash = hashIp("unknown");
    (prisma.$queryRaw as any).mockResolvedValueOnce([]); // bucket is at limit

    await expect(checkRateLimit(unknownHash)).rejects.toThrow(RateLimitError);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it("allows uploads below the rate limit threshold", async () => {
    const ipHash = hashIp("203.0.113.10");
    (prisma.$queryRaw as any).mockResolvedValueOnce([{ count: 6 }]); // below 10

    await expect(checkRateLimit(ipHash)).resolves.not.toThrow();
  });
});
