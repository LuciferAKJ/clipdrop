import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    share: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/cloudinary", () => ({
  deleteFromCloudinary: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

import { DELETE } from "@/app/api/dashboard/delete/route";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary } from "@/lib/cloudinary";

function makeRequest(shareId = "share-1") {
  return new NextRequest("https://clipdrop.example/api/dashboard/delete", {
    method: "DELETE",
    headers: {
      host: "clipdrop.example",
      origin: "https://clipdrop.example",
      "content-type": "application/json",
    },
    body: JSON.stringify({ shareId }),
  });
}

describe("DELETE /api/dashboard/delete cleanup lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({ userId: "user-1" });
    (prisma.share.findUnique as any).mockResolvedValue({
      id: "share-1",
      userId: "user-1",
      files: [
        {
          id: "file-1",
          publicId: "clipdrop/file-1",
          mimeType: "application/pdf",
        },
      ],
    });
    (prisma.share.updateMany as any).mockResolvedValue({ count: 1 });
    (prisma.share.delete as any).mockResolvedValue({ id: "share-1" });
    (deleteFromCloudinary as any).mockResolvedValue(undefined);
  });

  it("disables a share before deleting its Cloudinary assets and database row", async () => {
    const response = await DELETE(makeRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      pendingCleanup: false,
    });

    expect(prisma.share.updateMany).toHaveBeenCalledWith({
      where: { id: "share-1", userId: "user-1" },
      data: {
        consumedAt: expect.any(Date),
        expiresAt: expect.any(Date),
      },
    });
    expect(prisma.share.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
      (deleteFromCloudinary as any).mock.invocationCallOrder[0],
    );
    expect(prisma.share.delete).toHaveBeenCalledWith({
      where: { id: "share-1" },
    });
  });

  it("retains file references and returns 202 when Cloudinary deletion fails", async () => {
    (deleteFromCloudinary as any).mockRejectedValue(
      new Error("Cloudinary temporarily unavailable"),
    );

    const response = await DELETE(makeRequest());

    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({
      success: true,
      pendingCleanup: true,
    });
    expect(prisma.share.updateMany).toHaveBeenCalled();
    expect(prisma.share.delete).not.toHaveBeenCalled();
  });

  it("does not disable or delete a share owned by another user", async () => {
    (prisma.share.findUnique as any).mockResolvedValue({
      id: "share-1",
      userId: "someone-else",
      files: [],
    });

    const response = await DELETE(makeRequest());

    expect(response.status).toBe(403);
    expect(prisma.share.updateMany).not.toHaveBeenCalled();
    expect(prisma.share.delete).not.toHaveBeenCalled();
    expect(deleteFromCloudinary).not.toHaveBeenCalled();
  });

  it("rejects cross-origin requests before database access", async () => {
    const request = new NextRequest(
      "https://clipdrop.example/api/dashboard/delete",
      {
        method: "DELETE",
        headers: {
          host: "clipdrop.example",
          origin: "https://attacker.example",
          "content-type": "application/json",
        },
        body: JSON.stringify({ shareId: "share-1" }),
      },
    );

    const response = await DELETE(request);

    expect(response.status).toBe(403);
    expect(prisma.share.findUnique).not.toHaveBeenCalled();
  });
});
