import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    share: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { GET, POST } from "@/app/api/share/[code]/route";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { clearPasswordAttempts } from "@/lib/rateLimit";

function makeReq(
  code: string,
  body?: unknown,
  headers?: Record<string, string>,
) {
  return new NextRequest(`http://localhost/api/share/${code}`, {
    method: "POST",
    headers: {
      "x-real-ip": "198.51.100.20",
      ...(headers ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe("Share Concurrency & Limits (app/api/share/[code])", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("A. downloadLimit=1: only exactly 1 concurrent request succeeds, others receive 410", async () => {
    const shareRecord = {
      id: "share-1",
      code: "ONCE01",
      textContent: "Confidential one-time note",
      passwordHash: null,
      oneTimeUse: false,
      downloadLimit: 1,
      downloadCount: 0,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      createdAt: new Date(),
      files: [],
    };

    (prisma.share.findUnique as any).mockResolvedValue(shareRecord);

    // Simulate database atomic row update: first request finds downloadCount < 1 and matches 1 row.
    // Subsequent concurrent requests find row updated and match 0 rows.
    let currentCount = 0;
    (prisma.share.updateMany as any).mockImplementation(({ where }: any) => {
      if (where.downloadCount?.lt !== undefined) {
        if (currentCount < where.downloadCount.lt) {
          currentCount++;
          return Promise.resolve({ count: 1 });
        }
        return Promise.resolve({ count: 0 });
      }
      return Promise.resolve({ count: 1 });
    });

    const concurrentRequests = Array.from({ length: 8 }, () =>
      POST(makeReq("ONCE01", {}), {
        params: Promise.resolve({ code: "ONCE01" }),
      }),
    );

    const responses = await Promise.all(concurrentRequests);
    const statuses = responses.map((r) => r.status);

    const successCount = statuses.filter((s) => s === 200).length;
    const limitReachedCount = statuses.filter((s) => s === 410).length;

    expect(successCount).toBe(1);
    expect(limitReachedCount).toBe(7);
  });

  it("B. downloadLimit=N (e.g. N=3): exactly 3 concurrent requests succeed, 4th onwards receive 410", async () => {
    const shareRecord = {
      id: "share-n",
      code: "LIMIT3",
      textContent: "Multi-use secret",
      passwordHash: null,
      oneTimeUse: false,
      downloadLimit: 3,
      downloadCount: 0,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      createdAt: new Date(),
      files: [],
    };

    (prisma.share.findUnique as any).mockResolvedValue(shareRecord);

    let currentDownloads = 0;
    (prisma.share.updateMany as any).mockImplementation(({ where }: any) => {
      if (where.downloadCount?.lt !== undefined) {
        if (currentDownloads < where.downloadCount.lt) {
          currentDownloads++;
          return Promise.resolve({ count: 1 });
        }
        return Promise.resolve({ count: 0 });
      }
      // For consumedAt marking query
      return Promise.resolve({ count: 1 });
    });

    const concurrentRequests = Array.from({ length: 7 }, () =>
      POST(makeReq("LIMIT3", {}), {
        params: Promise.resolve({ code: "LIMIT3" }),
      }),
    );

    const responses = await Promise.all(concurrentRequests);
    const statuses = responses.map((r) => r.status);

    expect(statuses.filter((s) => s === 200).length).toBe(3);
    expect(statuses.filter((s) => s === 410).length).toBe(4);
  });

  it("C. unlimited share: allows concurrent downloads without limit restriction", async () => {
    const shareRecord = {
      id: "share-unlimited",
      code: "UNLIM1",
      textContent: "Public announcement",
      passwordHash: null,
      oneTimeUse: false,
      downloadLimit: null,
      downloadCount: 42,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      createdAt: new Date(),
      files: [],
    };

    (prisma.share.findUnique as any).mockResolvedValue(shareRecord);
    (prisma.share.updateMany as any).mockResolvedValue({ count: 1 });

    const requests = Array.from({ length: 5 }, () =>
      POST(makeReq("UNLIM1", {}), {
        params: Promise.resolve({ code: "UNLIM1" }),
      }),
    );

    const responses = await Promise.all(requests);
    responses.forEach((res) => {
      expect(res.status).toBe(200);
    });
  });

  it("H. password-protected share: rate limits repeated failed password attempts with 429", async () => {
    const rawPass = "SecretPass123";
    const hashed = await hashPassword(rawPass);
    const ip = "198.51.100.99";

    const shareRecord = {
      id: "share-pwd",
      code: "PWD123",
      textContent: "Encrypted note",
      passwordHash: hashed,
      oneTimeUse: false,
      downloadLimit: null,
      downloadCount: 0,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      createdAt: new Date(),
      files: [],
    };

    (prisma.share.findUnique as any).mockResolvedValue(shareRecord);
    (prisma.share.updateMany as any).mockResolvedValue({ count: 1 });

    // Clean any prior state for this test key
    clearPasswordAttempts(`pwd-fail:${ip}:${shareRecord.id}`);

    // Attempts 1 to 5 with wrong password return 401
    for (let i = 0; i < 5; i++) {
      const res = await POST(
        makeReq("PWD123", { password: "WrongPassword" }, { "x-real-ip": ip }),
        { params: Promise.resolve({ code: "PWD123" }) },
      );
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Invalid password");
    }

    // 6th attempt should be blocked by rate limiting with 429
    const blockedRes = await POST(
      makeReq("PWD123", { password: "WrongPassword" }, { "x-real-ip": ip }),
      { params: Promise.resolve({ code: "PWD123" }) },
    );
    expect(blockedRes.status).toBe(429);
    const blockedJson = await blockedRes.json();
    expect(blockedJson.error).toContain("Too many failed password attempts");

    // Clean up
    clearPasswordAttempts(`pwd-fail:${ip}:${shareRecord.id}`);
  }, 15000);

  it("GET endpoint reports requiresPassword and expiresAt appropriately", async () => {
    const shareRecord = {
      id: "share-meta",
      code: "META01",
      passwordHash: "hash-exists",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    };

    (prisma.share.findUnique as any).mockResolvedValue(shareRecord);

    const req = new NextRequest("http://localhost/api/share/META01", {
      headers: { "x-real-ip": "198.51.100.77" },
    });

    const res = await GET(req, { params: Promise.resolve({ code: "META01" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.requiresPassword).toBe(true);
  });
});
