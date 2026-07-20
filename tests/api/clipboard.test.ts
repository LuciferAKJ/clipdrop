import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    clipboardSync: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

import { GET, PUT } from "@/app/api/clipboard/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

function makePutReq(body: unknown) {
  return new NextRequest("http://localhost/api/clipboard", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

describe("GET /api/clipboard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    (auth as any).mockResolvedValue({ userId: null });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 204 when no clipboard exists yet", async () => {
    (auth as any).mockResolvedValue({ userId: "user_1" });
    (prisma.clipboardSync.findUnique as any).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(204);
  });

  it("returns the clipboard state when it exists", async () => {
    (auth as any).mockResolvedValue({ userId: "user_1" });
    (prisma.clipboardSync.findUnique as any).mockResolvedValue({
      contentType: "TEXT",
      textContent: "hello",
      shareId: null,
      updatedAt: new Date("2026-07-19T00:00:00.000Z"),
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      contentType: "TEXT",
      textContent: "hello",
      shareId: null,
      updatedAt: "2026-07-19T00:00:00.000Z",
    });
  });
});

describe("PUT /api/clipboard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    (auth as any).mockResolvedValue({ userId: null });
    const res = await PUT(
      makePutReq({ contentType: "TEXT", textContent: "hi" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for an invalid payload", async () => {
    (auth as any).mockResolvedValue({ userId: "user_1" });
    const res = await PUT(makePutReq({ contentType: "TEXT" })); // missing textContent
    expect(res.status).toBe(400);
  });

  it("upserts a TEXT payload and clears shareId", async () => {
    (auth as any).mockResolvedValue({ userId: "user_1" });
    (prisma.clipboardSync.upsert as any).mockResolvedValue({
      contentType: "TEXT",
      textContent: "hello",
      shareId: null,
      updatedAt: new Date("2026-07-19T00:00:00.000Z"),
    });

    const res = await PUT(
      makePutReq({ contentType: "TEXT", textContent: "hello" }),
    );
    expect(res.status).toBe(200);
    expect(prisma.clipboardSync.upsert).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      update: { contentType: "TEXT", textContent: "hello", shareId: null },
      create: {
        userId: "user_1",
        contentType: "TEXT",
        textContent: "hello",
        shareId: null,
      },
    });
  });

  it("upserts a SHARE payload and clears textContent", async () => {
    (auth as any).mockResolvedValue({ userId: "user_1" });
    (prisma.clipboardSync.upsert as any).mockResolvedValue({
      contentType: "SHARE",
      textContent: null,
      shareId: "share_1",
      updatedAt: new Date("2026-07-19T00:00:00.000Z"),
    });

    const res = await PUT(
      makePutReq({ contentType: "SHARE", shareId: "share_1" }),
    );
    expect(res.status).toBe(200);
    expect(prisma.clipboardSync.upsert).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      update: { contentType: "SHARE", textContent: null, shareId: "share_1" },
      create: {
        userId: "user_1",
        contentType: "SHARE",
        textContent: null,
        shareId: "share_1",
      },
    });
  });
});
