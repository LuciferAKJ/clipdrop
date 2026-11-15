import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { logger } from "@/lib/logger";
import { isSameOriginRequest } from "@/lib/csrf";

export async function DELETE(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json(
      { error: "Cross-origin request rejected" },
      { status: 403 },
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { shareId } = await req.json().catch(() => ({ shareId: null }));
  if (!shareId) {
    return NextResponse.json({ error: "shareId is required" }, { status: 400 });
  }

  const share = await prisma.share.findUnique({
    where: { id: shareId },
    include: { files: true },
  });

  if (!share) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (share.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Disable retrieval before deleting external assets so a concurrent
  // recipient cannot start a new download while cleanup is in progress.
  const disableResult = await prisma.share.updateMany({
    where: { id: share.id, userId },
    data: { consumedAt: new Date(), expiresAt: new Date() },
  });
  if (disableResult.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const deletionResults = await Promise.allSettled(
    share.files.map((file) =>
      deleteFromCloudinary(file.publicId, file.mimeType),
    ),
  );
  const hasDeletionFailure = deletionResults.some(
    (result) => result.status === "rejected",
  );

  if (hasDeletionFailure) {
    // Keep File rows for assets that may still exist; the scheduled cleanup
    // endpoint will retry them on its next run.
    logger.warn("Share disabled; one or more file assets need cleanup retry", {
      shareId: share.id,
    });
    return NextResponse.json(
      {
        success: true,
        pendingCleanup: true,
        message: "Share disabled. File cleanup will be retried automatically.",
      },
      { status: 202 },
    );
  }

  try {
    await prisma.share.delete({ where: { id: share.id } });
    return NextResponse.json({ success: true, pendingCleanup: false });
  } catch (error) {
    logger.error("Failed to delete share after Cloudinary cleanup", error);
    // The record is already disabled and remains eligible for the cleanup
    // cron. Return 202 so the client knows the deletion is pending.
    return NextResponse.json(
      {
        success: true,
        pendingCleanup: true,
        message: "Share disabled. Database cleanup will be retried automatically.",
      },
      { status: 202 },
    );
  }
}
