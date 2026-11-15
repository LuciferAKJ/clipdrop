import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function DELETE(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json(
          { error: "Cross-origin request rejected" },
          { status: 403 },
        );
      }
    } catch {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
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

  const deletionResults = await Promise.allSettled(
    share.files.map((file) =>
      deleteFromCloudinary(file.publicId, file.mimeType),
    ),
  );
  const hasDeletionFailure = deletionResults.some(
    (result) => result.status === "rejected",
  );

  if (hasDeletionFailure) {
    // Hide the share immediately, but keep its File rows so the scheduled
    // cleanup job can retry any assets Cloudinary did not delete.
    await prisma.share.updateMany({
      where: { id: share.id, userId },
      data: { consumedAt: new Date(), expiresAt: new Date() },
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

  await prisma.share.delete({ where: { id: share.id } });

  return NextResponse.json({ success: true, pendingCleanup: false });
}
