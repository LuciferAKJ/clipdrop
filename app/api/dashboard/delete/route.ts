import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function DELETE(req: NextRequest) {
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

  for (const file of share.files) {
    await deleteFromCloudinary(file.publicId).catch(() => {});
  }
  await prisma.share.delete({ where: { id: share.id } });

  return NextResponse.json({ success: true });
}