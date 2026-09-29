import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { getClientIp, hashIp } from "@/lib/ipHash";
import {
  checkMemoryRateLimit,
  checkPasswordRateLimit,
  recordFailedPasswordAttempt,
  clearPasswordAttempts,
  RateLimitError,
} from "@/lib/rateLimit";

// Metadata only (GET should NOT check consumedAt)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const ipHash = hashIp(getClientIp(req));

  try {
    checkMemoryRateLimit(
      `share-get:${ipHash}`,
      60,
      60_000,
      "Too many requests — please wait a moment and try again.",
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    throw error;
  }

  const { code } = await params;

  const share = await prisma.share.findUnique({
    where: {
      code: code.toUpperCase(),
    },
  });

  if (!share) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (share.expiresAt < new Date()) {
    return NextResponse.json({ error: "Expired" }, { status: 410 });
  }

  return NextResponse.json({
    requiresPassword: !!share.passwordHash,
  });
}

// Actual download / consumption (POST handles limit checks & increments atomically)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const ipHash = hashIp(getClientIp(req));

  try {
    checkMemoryRateLimit(
      `share-post:${ipHash}`,
      60,
      60_000,
      "Too many requests — please wait a moment and try again.",
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    throw error;
  }

  const { password } = await req.json().catch(() => ({ password: null }));

  const share = await prisma.share.findUnique({
    where: {
      code: code.toUpperCase(),
    },
    include: {
      files: true,
    },
  });

  if (!share) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const effectiveLimit = share.downloadLimit ?? (share.oneTimeUse ? 1 : null);

  // Early checks for expired or already consumed shares
  if (share.consumedAt !== null) {
    return NextResponse.json(
      { error: "Download limit reached" },
      { status: 410 },
    );
  }

  if (effectiveLimit !== null && share.downloadCount >= effectiveLimit) {
    return NextResponse.json(
      { error: "Download limit reached" },
      { status: 410 },
    );
  }

  if (share.expiresAt < new Date()) {
    return NextResponse.json({ error: "Expired" }, { status: 410 });
  }

  // Password verification with brute-force rate limiting
  const passwordRateKey = `pwd-fail:${ipHash}:${share.id}`;
  if (share.passwordHash) {
    try {
      checkPasswordRateLimit(passwordRateKey, 5);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json({ error: error.message }, { status: 429 });
      }
      throw error;
    }

    const valid =
      password && (await verifyPassword(password, share.passwordHash));

    if (!valid) {
      recordFailedPasswordAttempt(passwordRateKey, 5 * 60 * 1000);
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Clear failed attempts on successful password entry
    clearPasswordAttempts(passwordRateKey);
  }

  // Atomic download-limit and consumption enforcement
  if (effectiveLimit !== null) {
    const updateResult = await prisma.share.updateMany({
      where: {
        id: share.id,
        consumedAt: null,
        downloadCount: {
          lt: effectiveLimit,
        },
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        downloadCount: {
          increment: 1,
        },
        ...(effectiveLimit === 1 ? { consumedAt: new Date() } : {}),
      },
    });

    if (updateResult.count === 0) {
      // Race condition handled: another request claimed the final download or share expired
      return NextResponse.json(
        { error: "Download limit reached" },
        { status: 410 },
      );
    }

    // For multi-download limits (N > 1), mark consumedAt when threshold reached
    if (effectiveLimit > 1) {
      await prisma.share.updateMany({
        where: {
          id: share.id,
          downloadCount: {
            gte: effectiveLimit,
          },
          consumedAt: null,
        },
        data: {
          consumedAt: new Date(),
        },
      });
    }
  } else {
    // Unlimited share: increment download count while checking expiration atomically
    const updateResult = await prisma.share.updateMany({
      where: {
        id: share.id,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: "Expired" }, { status: 410 });
    }
  }

  return NextResponse.json({
    textContent: share.textContent,
    files: share.files,
    createdAt: share.createdAt,
  });
}
