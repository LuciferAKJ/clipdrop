import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    device: { findMany: vi.fn(), upsert: vi.fn() },
  },
}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

import { GET, POST } from "@/app/api/devices/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

function makePostReq(body: unknown) {
  return new NextRequest("http://localhost/api/devices", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("GET /api/devices", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    (auth as any).mockResolvedValue({ userId: null });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns the authenticated user's devices sorted by lastSeenAt", async () => {
    (auth as any).mockResolvedValue({ userId: "user_1" });
    (prisma.device.findMany as any).mockResolvedValue([{ id: "d1" }]);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.devices).toEqual([{ id: "d1" }]);
    expect(prisma.device.findMany).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      orderBy: { lastSeenAt: "desc" },
    });
  });
});

describe("POST /api/devices", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    (auth as any).mockResolvedValue({ userId: null });
    const res = await POST(
      makePostReq({ clientId: "c1", name: "Chrome on Mac" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for an invalid payload", async () => {
    (auth as any).mockResolvedValue({ userId: "user_1" });
    const res = await POST(makePostReq({ clientId: "", name: "" }));
    expect(res.status).toBe(400);
  });

  it("upserts and returns success for a valid payload", async () => {
    (auth as any).mockResolvedValue({ userId: "user_1" });
    (prisma.device.upsert as any).mockResolvedValue({ id: "d1" });

    const res = await POST(
      makePostReq({ clientId: "c1", name: "Chrome on Mac" }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ success: true });
    expect(prisma.device.upsert).toHaveBeenCalledWith({
      where: { userId_clientId: { userId: "user_1", clientId: "c1" } },
      update: { lastSeenAt: expect.any(Date) },
      create: { userId: "user_1", clientId: "c1", name: "Chrome on Mac" },
    });
  });
});
