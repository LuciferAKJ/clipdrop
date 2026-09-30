import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { CLEANUP_BATCH_SIZE } from "@/lib/constants";
import { logger } from "@/lib/logger";

/**
 * Validates the Authorization header against CRON_SECRET using a timing-safe
 * comparison over fixed-length cryptographic digests.
 *
 * Guarantees:
 * - Rejects if CRON_SECRET is missing or empty.
 * - Rejects if Authorization header is missing, malformed, or has an empty token.
 * - Never throws on length mismatch because SHA-256 digests are always 32 bytes.
 * - Protects against timing attacks.
 */
export function verifyCronSecret(
  authHeader: string | null | undefined,
): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.trim().length === 0) {
    return false;
  }

  if (!authHeader || typeof authHeader !== "string") {
    return false;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return false;
  }

  const token = match[1].trim();
  if (!token) {
    return false;
  }

  const expectedDigest = createHash("sha256").update(secret).digest();
  const actualDigest = createHash("sha256").update(token).digest();

  return timingSafeEqual(expectedDigest, actualDigest);
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");

  if (!verifyCronSecret(auth)) {
    logger.warn("[Cleanup] Unauthorized cron execution attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const now = new Date();

  let eligibleShares;
  try {
    eligibleShares = await prisma.share.findMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { consumedAt: { not: null } }],
      },
      take: CLEANUP_BATCH_SIZE,
      orderBy: {
        createdAt: "asc",
      },
      include: {
        files: true,
      },
    });
  } catch (err) {
    logger.error(
      "[Cleanup] Failed to query expired/consumed shares from database",
      err,
    );
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 },
    );
  }

  logger.info("[Cleanup] Starting cron cleanup run", {
    candidates: eligibleShares.length,
    batchLimit: CLEANUP_BATCH_SIZE,
  });

  let deletedShares = 0;
  let deletedFiles = 0;
  let failedShares = 0;

  for (const share of eligibleShares) {
    try {
      // 1. Delete associated Cloudinary assets if any
      if (share.files.length > 0) {
        const deleteResults = await Promise.allSettled(
          share.files.map((file) =>
            deleteFromCloudinary(file.publicId, file.mimeType),
          ),
        );

        const hasFailure = deleteResults.some(
          (result) => result.status === "rejected",
        );

        if (hasFailure) {
          const rejectedReasons = deleteResults
            .filter((r): r is PromiseRejectedResult => r.status === "rejected")
            .map((r) =>
              r.reason instanceof Error ? r.reason.message : String(r.reason),
            );

          logger.error(
            `[Cleanup] Cloudinary deletion failed for one or more files in share ${share.code}`,
            { failures: rejectedReasons },
          );

          failedShares++;
          // Preserve the share in DB for subsequent retry; do NOT delete
          continue;
        }
      }

      // 2. All Cloudinary assets (if any) deleted successfully -> delete Share record.
      // File records cascade-delete in database automatically via schema relation.
      await prisma.share.delete({
        where: { id: share.id },
      });

      deletedShares++;
      deletedFiles += share.files.length;
    } catch (err) {
      logger.error(`[Cleanup] Error cleaning up share ${share.code}`, err);
      failedShares++;
    }
  }

  const durationMs = Date.now() - startTime;
  logger.info("[Cleanup] Finished cron cleanup run", {
    candidates: eligibleShares.length,
    deletedShares,
    deletedFiles,
    failedShares,
    durationMs,
  });

  return NextResponse.json({
    deletedShares,
    deletedFiles,
    failedShares,
    batchCandidates: eligibleShares.length,
    durationMs,
  });
}
