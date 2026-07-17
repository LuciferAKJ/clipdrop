import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const share = await prisma.share.findUnique({
    where: {
      code: code.toUpperCase(),
    },
    include: {
      files: true,
    },
  });

  if (!share) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  if (share.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Expired" },
      { status: 410 }
    );
  }

  return NextResponse.json({
    textContent: share.textContent,
    createdAt: share.createdAt,
    expiresAt: share.expiresAt,
    files: share.files.map((file) => ({
      url: file.url,
      name: file.originalName,
      type: file.mimeType,
      size: file.sizeBytes,
    })),
  });
}