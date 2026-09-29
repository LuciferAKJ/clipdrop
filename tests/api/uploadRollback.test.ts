import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    share: {
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
    file: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/cloudinary", () => ({
  uploadToCloudinary: vi.fn(),
  deleteFromCloudinary: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: null }),
}));

vi.mock("@/lib/codeGen", () => ({
  generateUniqueCode: vi.fn().mockResolvedValue("TEST99"),
}));

import { POST } from "@/app/api/upload/route";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

function makeUploadReq(formData: FormData, ip = "198.51.100.11") {
  const headers = new Headers();
  headers.set("content-type", "multipart/form-data");
  headers.set("x-real-ip", ip);

  return {
    headers,
    formData: vi.fn().mockResolvedValue(formData),
    json: vi.fn().mockRejectedValue(new Error("Not JSON")),
  } as unknown as NextRequest;
}

describe("Upload Pre-validation & Rollback (app/api/upload)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.share.count as any).mockResolvedValue(0); // rate limiting passes
  });

  it("F. multi-file upload rejects upfront if any file fails validation without touching Cloudinary or DB", async () => {
    const validFile = new File(["valid image"], "photo.png", {
      type: "image/png",
    });
    // Disallowed executable mime type
    const invalidFile = new File(["malware"], "script.exe", {
      type: "application/x-msdownload",
    });

    const formData = new FormData();
    formData.append("files", validFile);
    formData.append("files", invalidFile);

    const req = makeUploadReq(formData, "198.51.100.11");

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/This file type is not allowed/);

    // Verify ZERO Cloudinary uploads and ZERO database creations took place
    expect(uploadToCloudinary).not.toHaveBeenCalled();
    expect(prisma.share.create).not.toHaveBeenCalled();
  });

  it("G. multi-file upload performs complete rollback if Cloudinary upload fails midway", async () => {
    const file1 = new File(["content 1"], "doc1.pdf", {
      type: "application/pdf",
    });
    const file2 = new File(["content 2"], "doc2.pdf", {
      type: "application/pdf",
    });

    const formData = new FormData();
    formData.append("files", file1);
    formData.append("files", file2);

    const mockShare = { id: "share-temp-id", code: "TEST99" };
    (prisma.share.create as any).mockResolvedValue(mockShare);
    (prisma.file.create as any).mockResolvedValue({});
    (prisma.share.delete as any).mockResolvedValue({});
    (deleteFromCloudinary as any).mockResolvedValue({});

    // File 1 succeeds, File 2 fails
    (uploadToCloudinary as any)
      .mockResolvedValueOnce({
        url: "https://res.cloudinary.com/demo/raw/upload/clipdrop/uuid-doc1.pdf",
        publicId: "clipdrop/uuid-doc1.pdf",
      })
      .mockRejectedValueOnce(new Error("Cloudinary connection reset"));

    const req = makeUploadReq(formData, "198.51.100.12");

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Cloudinary connection reset");

    // Rollback verification:
    // 1. File 1 was cleaned up from Cloudinary
    expect(deleteFromCloudinary).toHaveBeenCalledWith(
      "clipdrop/uuid-doc1.pdf",
      "application/pdf",
    );
    // 2. Created Share was deleted from DB (cascading any File rows)
    expect(prisma.share.delete).toHaveBeenCalledWith({
      where: { id: "share-temp-id" },
    });
  });

  it("I. legitimate multi-file upload creates share and files successfully", async () => {
    const file1 = new File(["content 1"], "photo.png", { type: "image/png" });
    const file2 = new File(["content 2"], "doc.txt", { type: "text/plain" });

    const formData = new FormData();
    formData.append("files", file1);
    formData.append("files", file2);
    formData.append("text", "Optional note");

    const mockShare = { id: "share-success", code: "TEST99" };
    (prisma.share.create as any).mockResolvedValue(mockShare);
    (prisma.file.create as any).mockResolvedValue({});

    (uploadToCloudinary as any)
      .mockResolvedValueOnce({
        url: "https://res.cloudinary.com/demo/image/upload/clipdrop/uuid-photo.png",
        publicId: "clipdrop/uuid-photo",
      })
      .mockResolvedValueOnce({
        url: "https://res.cloudinary.com/demo/raw/upload/clipdrop/uuid-doc.txt",
        publicId: "clipdrop/uuid-doc.txt",
      });

    const req = makeUploadReq(formData, "198.51.100.13");

    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.code).toBe("TEST99");

    expect(prisma.file.create).toHaveBeenCalledTimes(2);
    expect(deleteFromCloudinary).not.toHaveBeenCalled();
    expect(prisma.share.delete).not.toHaveBeenCalled();
  });
});
