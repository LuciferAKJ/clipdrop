import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { validateClipboardSync } from "@/lib/validation";
import type { ClipboardState } from "@/lib/types/clipboard";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sync = await prisma.clipboardSync.findUnique({ where: { userId } });

  if (!sync) {
    return new NextResponse(null, { status: 204 });
  }

  const state: ClipboardState = {
    contentType: sync.contentType,
    textContent: sync.textContent,
    shareId: sync.shareId,
    updatedAt: sync.updatedAt.toISOString(),
  };

  return NextResponse.json(state);
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { contentType, textContent, shareId } = body;

  try {
    validateClipboardSync(contentType, textContent, shareId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid input";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Single upsert on the ClipboardSync PK (userId). Text and share are
  // mutually exclusive per row: storing TEXT clears shareId, storing
  // SHARE clears textContent, in the same operation on both branches.
  const data =
    contentType === "TEXT"
      ? { contentType: "TEXT" as const, textContent, shareId: null }
      : { contentType: "SHARE" as const, textContent: null, shareId };

  const sync = await prisma.clipboardSync.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

  const state: ClipboardState = {
    contentType: sync.contentType,
    textContent: sync.textContent,
    shareId: sync.shareId,
    updatedAt: sync.updatedAt.toISOString(),
  };

  return NextResponse.json(state);
}
