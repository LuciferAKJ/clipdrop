import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/share/[code]/route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    share: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),      // add this
      deleteMany: vi.fn(),
    },
  },
}));

function makeReq(body?: unknown) {
  return new NextRequest("http://localhost/api/share/ABC123", {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/share/[code]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 for unknown code", async () => {
    (prisma.share.findUnique as any).mockResolvedValue(null);
    const res = await GET(makeReq(), { params: { code: "NOPE" } });
    expect(res.status).toBe(404);
  });

  it("returns 410 for expired share", async () => {
    (prisma.share.findUnique as any).mockResolvedValue({
      expiresAt: new Date(Date.now() - 1000),
      passwordHash: null,
    });
    const res = await GET(makeReq(), { params: { code: "ABC123" } });
    expect(res.status).toBe(410);
  });

  it("reports requiresPassword correctly", async () => {
    (prisma.share.findUnique as any).mockResolvedValue({
      expiresAt: new Date(Date.now() + 100000),
      passwordHash: "somehash",
    });
    const res = await GET(makeReq(), { params: { code: "ABC123" } });
    const json = await res.json();
    expect(json.requiresPassword).toBe(true);
  });
});

describe("POST /api/share/[code]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects wrong password", async () => {
    (prisma.share.findUnique as any).mockResolvedValue({
      id: "1",
      expiresAt: new Date(Date.now() + 100000),
      passwordHash: await (await import("@/lib/password")).hashPassword("correct"),
      files: [],
      oneTimeUse: false,
    });
    const res = await POST(makeReq({ password: "wrong" }), { params: { code: "ABC123" } });
    expect(res.status).toBe(401);
  });

  it("deletes share on one-time download", async () => {
    (prisma.share.findUnique as any).mockResolvedValue({
      id: "1",
      expiresAt: new Date(Date.now() + 100000),
      passwordHash: null,
      files: [],
      oneTimeUse: true,
      textContent: "secret",
    });
    (prisma.share.delete as any).mockResolvedValue({});

    const res = await POST(makeReq({}), { params: { code: "ABC123" } });
    expect(prisma.share.delete).toHaveBeenCalledWith({ where: { id: "1" } });
    expect(res.status).toBe(200);
  });
});