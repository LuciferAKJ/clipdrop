import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    share: {
      findMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/cloudinary", () => ({
  deleteFromCloudinary: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { GET, verifyCronSecret } from "@/app/api/cron/cleanup/route";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { CLEANUP_BATCH_SIZE } from "@/lib/constants";

function makeReq(authHeader?: string) {
  return new NextRequest("http://localhost/api/cron/cleanup", {
    method: "GET",
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe("Cron Cleanup Hardening (app/api/cron/cleanup/route.ts)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Authentication & Timing-Safe Verification", () => {
    it("A. Missing CRON_SECRET → unauthorized (401)", async () => {
      delete process.env.CRON_SECRET;
      const res = await GET(makeReq("Bearer some-token"));
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
      expect(prisma.share.findMany).not.toHaveBeenCalled();
    });

    it("B. Empty CRON_SECRET → unauthorized (401)", async () => {
      process.env.CRON_SECRET = "   ";
      const res = await GET(makeReq("Bearer some-token"));
      expect(res.status).toBe(401);
      expect(prisma.share.findMany).not.toHaveBeenCalled();
    });

    it("C. Missing or wrong Authorization header → unauthorized (401)", async () => {
      process.env.CRON_SECRET = "super-secret-cron-key-123";

      // 1. Missing header
      const res1 = await GET(makeReq());
      expect(res1.status).toBe(401);

      // 2. Wrong scheme
      const res2 = await GET(makeReq("Basic super-secret-cron-key-123"));
      expect(res2.status).toBe(401);

      // 3. Incorrect token
      const res3 = await GET(makeReq("Bearer wrong-key"));
      expect(res3.status).toBe(401);

      // 4. "Bearer undefined" literal string
      const res4 = await GET(makeReq("Bearer undefined"));
      expect(res4.status).toBe(401);

      // 5. Empty token
      const res5 = await GET(makeReq("Bearer "));
      expect(res5.status).toBe(401);

      expect(prisma.share.findMany).not.toHaveBeenCalled();
    });

    it("D. Correct secret → authorized (proceeds to query DB)", async () => {
      process.env.CRON_SECRET = "super-secret-cron-key-123";
      (prisma.share.findMany as any).mockResolvedValue([]);

      const res = await GET(makeReq("Bearer super-secret-cron-key-123"));
      expect(res.status).toBe(200);
      expect(prisma.share.findMany).toHaveBeenCalled();
    });

    it("E. Timing-safe comparison does not throw on wrong-length tokens", () => {
      process.env.CRON_SECRET = "short";

      // Length smaller than secret
      expect(() => verifyCronSecret("Bearer a")).not.toThrow();
      expect(verifyCronSecret("Bearer a")).toBe(false);

      // Length much longer than secret
      const longToken = "a".repeat(1000);
      expect(() => verifyCronSecret(`Bearer ${longToken}`)).not.toThrow();
      expect(verifyCronSecret(`Bearer ${longToken}`)).toBe(false);

      // Empty or non-string
      expect(() => verifyCronSecret(null)).not.toThrow();
      expect(verifyCronSecret(null)).toBe(false);
      expect(() => verifyCronSecret("")).not.toThrow();
      expect(verifyCronSecret("")).toBe(false);
    });
  });

  describe("Workload Bounding & Query Semantics", () => {
    beforeEach(() => {
      process.env.CRON_SECRET = "cron-test-secret";
    });

    it("F. Cleanup queries only a bounded batch size in deterministic order", async () => {
      (prisma.share.findMany as any).mockResolvedValue([]);

      await GET(makeReq("Bearer cron-test-secret"));

      expect(prisma.share.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: CLEANUP_BATCH_SIZE,
          orderBy: { createdAt: "asc" },
        }),
      );
    });

    it("P. Query selects only expired OR consumed shares, leaving active untouched", async () => {
      (prisma.share.findMany as any).mockResolvedValue([]);

      await GET(makeReq("Bearer cron-test-secret"));

      const queryArgs = (prisma.share.findMany as any).mock.calls[0][0];
      expect(queryArgs.where).toEqual({
        OR: [
          { expiresAt: { lt: expect.any(Date) } },
          { consumedAt: { not: null } },
        ],
      });
    });
  });

  describe("Asset Deletion & DB Cleanup Execution", () => {
    beforeEach(() => {
      process.env.CRON_SECRET = "cron-test-secret";
      (deleteFromCloudinary as any).mockResolvedValue(undefined);
      (prisma.share.delete as any).mockResolvedValue({ id: "deleted-share" });
    });

    it("G. Expired Share with file: removes Cloudinary asset and deletes Share record", async () => {
      const expiredShare = {
        id: "share-exp-1",
        code: "EXP01",
        files: [
          {
            id: "file-1",
            publicId: "clipdrop/uuid-1-file.png",
            mimeType: "image/png",
          },
        ],
      };

      (prisma.share.findMany as any).mockResolvedValue([expiredShare]);

      const res = await GET(makeReq("Bearer cron-test-secret"));
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.deletedShares).toBe(1);
      expect(json.deletedFiles).toBe(1);
      expect(json.failedShares).toBe(0);

      expect(deleteFromCloudinary).toHaveBeenCalledWith(
        "clipdrop/uuid-1-file.png",
        "image/png",
      );
      expect(prisma.share.delete).toHaveBeenCalledWith({
        where: { id: "share-exp-1" },
      });
    });

    it("H. Consumed Share: removes Cloudinary asset and deletes Share record", async () => {
      const consumedShare = {
        id: "share-consumed-1",
        code: "USED01",
        files: [
          {
            id: "file-2",
            publicId: "clipdrop/uuid-2-doc.pdf",
            mimeType: "application/pdf",
          },
        ],
      };

      (prisma.share.findMany as any).mockResolvedValue([consumedShare]);

      const res = await GET(makeReq("Bearer cron-test-secret"));
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.deletedShares).toBe(1);
      expect(json.deletedFiles).toBe(1);
      expect(prisma.share.delete).toHaveBeenCalledWith({
        where: { id: "share-consumed-1" },
      });
    });

    it("I. Text-only Share: deletes Share record without attempting Cloudinary calls", async () => {
      const textShare = {
        id: "share-text-only",
        code: "TEXT01",
        files: [],
      };

      (prisma.share.findMany as any).mockResolvedValue([textShare]);

      const res = await GET(makeReq("Bearer cron-test-secret"));
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.deletedShares).toBe(1);
      expect(json.deletedFiles).toBe(0);
      expect(deleteFromCloudinary).not.toHaveBeenCalled();
      expect(prisma.share.delete).toHaveBeenCalledWith({
        where: { id: "share-text-only" },
      });
    });

    it("J. Multiple-file Share: deletes every asset before deleting Share record", async () => {
      const multiFileShare = {
        id: "share-multi-1",
        code: "MULTI1",
        files: [
          { id: "f1", publicId: "clipdrop/asset-1", mimeType: "image/jpeg" },
          { id: "f2", publicId: "clipdrop/asset-2", mimeType: "video/mp4" },
          {
            id: "f3",
            publicId: "clipdrop/asset-3",
            mimeType: "application/pdf",
          },
        ],
      };

      (prisma.share.findMany as any).mockResolvedValue([multiFileShare]);

      const res = await GET(makeReq("Bearer cron-test-secret"));
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.deletedShares).toBe(1);
      expect(json.deletedFiles).toBe(3);
      expect(deleteFromCloudinary).toHaveBeenCalledTimes(3);
      expect(deleteFromCloudinary).toHaveBeenCalledWith(
        "clipdrop/asset-1",
        "image/jpeg",
      );
      expect(deleteFromCloudinary).toHaveBeenCalledWith(
        "clipdrop/asset-2",
        "video/mp4",
      );
      expect(deleteFromCloudinary).toHaveBeenCalledWith(
        "clipdrop/asset-3",
        "application/pdf",
      );
      expect(prisma.share.delete).toHaveBeenCalledWith({
        where: { id: "share-multi-1" },
      });
    });

    it("K. One asset failure prevents Share DB deletion and preserves record for retry", async () => {
      const multiFileShare = {
        id: "share-partial-fail",
        code: "FAIL01",
        files: [
          { id: "f1", publicId: "clipdrop/asset-ok", mimeType: "image/jpeg" },
          { id: "f2", publicId: "clipdrop/asset-fail", mimeType: "image/png" },
        ],
      };

      (prisma.share.findMany as any).mockResolvedValue([multiFileShare]);
      (deleteFromCloudinary as any).mockImplementation((publicId: string) => {
        if (publicId === "clipdrop/asset-fail") {
          return Promise.reject(
            new Error("Cloudinary 503 Service Unavailable"),
          );
        }
        return Promise.resolve();
      });

      const res = await GET(makeReq("Bearer cron-test-secret"));
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.deletedShares).toBe(0);
      expect(json.deletedFiles).toBe(0);
      expect(json.failedShares).toBe(1);

      // Crucial: Share was NOT deleted from the database
      expect(prisma.share.delete).not.toHaveBeenCalled();
    });

    it("L. Later retry succeeds after previous Cloudinary failure", async () => {
      const failingShare = {
        id: "share-retry-1",
        code: "RETRY1",
        files: [
          { id: "f1", publicId: "clipdrop/asset-retry", mimeType: "image/png" },
        ],
      };

      // Run 1: Cloudinary fails
      (prisma.share.findMany as any).mockResolvedValue([failingShare]);
      (deleteFromCloudinary as any).mockRejectedValueOnce(
        new Error("Network timeout"),
      );

      const res1 = await GET(makeReq("Bearer cron-test-secret"));
      const json1 = await res1.json();
      expect(json1.deletedShares).toBe(0);
      expect(json1.failedShares).toBe(1);
      expect(prisma.share.delete).not.toHaveBeenCalled();

      // Run 2: Cloudinary now succeeds
      (deleteFromCloudinary as any).mockResolvedValueOnce(undefined);

      const res2 = await GET(makeReq("Bearer cron-test-secret"));
      const json2 = await res2.json();
      expect(json2.deletedShares).toBe(1);
      expect(json2.deletedFiles).toBe(1);
      expect(json2.failedShares).toBe(0);
      expect(prisma.share.delete).toHaveBeenCalledWith({
        where: { id: "share-retry-1" },
      });
    });

    it("M. Re-running cleanup is safe and idempotent", async () => {
      // Run 1: 1 share cleaned
      (prisma.share.findMany as any).mockResolvedValueOnce([
        { id: "s1", code: "S01", files: [] },
      ]);
      const res1 = await GET(makeReq("Bearer cron-test-secret"));
      expect((await res1.json()).deletedShares).toBe(1);

      // Run 2: No more expired shares left
      (prisma.share.findMany as any).mockResolvedValueOnce([]);
      const res2 = await GET(makeReq("Bearer cron-test-secret"));
      const json2 = await res2.json();
      expect(json2.deletedShares).toBe(0);
      expect(json2.batchCandidates).toBe(0);
      expect(prisma.share.delete).toHaveBeenCalledTimes(1); // Only called during run 1
    });

    it("N. Independent failing Share does not block processing of subsequent Shares", async () => {
      const share1Fails = {
        id: "share-failing",
        code: "FAIL1",
        files: [{ id: "f1", publicId: "fail-asset", mimeType: "image/png" }],
      };
      const share2Text = {
        id: "share-text-ok",
        code: "TEXT1",
        files: [],
      };
      const share3FileOk = {
        id: "share-file-ok",
        code: "OK1",
        files: [{ id: "f2", publicId: "ok-asset", mimeType: "image/png" }],
      };

      (prisma.share.findMany as any).mockResolvedValue([
        share1Fails,
        share2Text,
        share3FileOk,
      ]);

      (deleteFromCloudinary as any).mockImplementation((publicId: string) => {
        if (publicId === "fail-asset") {
          return Promise.reject(new Error("Cloudinary error"));
        }
        return Promise.resolve();
      });

      const res = await GET(makeReq("Bearer cron-test-secret"));
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.deletedShares).toBe(2);
      expect(json.deletedFiles).toBe(1);
      expect(json.failedShares).toBe(1);

      expect(prisma.share.delete).not.toHaveBeenCalledWith({
        where: { id: "share-failing" },
      });
      expect(prisma.share.delete).toHaveBeenCalledWith({
        where: { id: "share-text-ok" },
      });
      expect(prisma.share.delete).toHaveBeenCalledWith({
        where: { id: "share-file-ok" },
      });
    });

    it("O. Returns 500 when database findMany query fails", async () => {
      (prisma.share.findMany as any).mockRejectedValue(
        new Error("Database connection down"),
      );

      const res = await GET(makeReq("Bearer cron-test-secret"));
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("Database query failed");
    });
  });
});
