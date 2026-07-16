import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateUniqueCode } from "@/lib/codeGen";
import { validateTextShare } from "@/lib/validation";

const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  try {
    const { text, expiresInMinutes } = await req.json();

    validateTextShare(text);

    const code = await generateUniqueCode();

    const expiresAt = new Date(
      Date.now() +
        (expiresInMinutes
          ? expiresInMinutes * 60_000
          : EXPIRY_MS)
    );

    const share = await prisma.share.create({
      data: {
        code,
        textContent: text,
        expiresAt,
      },
    });

    return NextResponse.json(
      { code: share.code },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed";

    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}