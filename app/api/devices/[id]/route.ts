import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { validateDeviceName } from "@/lib/validation";
import { isSameOriginRequest } from "@/lib/csrf";
import {
  RATE_LIMIT_DEVICE_MAX,
  RATE_LIMIT_WINDOW_MS,
} from "@/lib/constants";
import { consumeRateLimit, RateLimitError } from "@/lib/rateLimit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await consumeRateLimit(
      `device-write:${userId}`,
      RATE_LIMIT_DEVICE_MAX,
      RATE_LIMIT_WINDOW_MS,
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    throw error;
  }

  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  try {
    validateDeviceName(body.name);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid input";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const result = await prisma.device.updateMany({
    where: {
      id,
      userId,
    },
    data: {
      name: body.name,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    name: body.name,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await consumeRateLimit(
      `device-write:${userId}`,
      RATE_LIMIT_DEVICE_MAX,
      RATE_LIMIT_WINDOW_MS,
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    throw error;
  }

  const currentClientId = req.headers.get("x-client-id");

  if (!currentClientId) {
    return NextResponse.json(
      { error: "Missing x-client-id header" },
      { status: 400 }
    );
  }

  const result = await prisma.device.deleteMany({
    where: {
      id,
      userId,
      NOT: {
        clientId: currentClientId,
      },
    },
  });

  if (result.count === 1) {
    return NextResponse.json({ success: true });
  }

  const device = await prisma.device.findUnique({
    where: {
      id,
    },
  });

  if (!device || device.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      error: "Cannot delete the device you're currently using",
    },
    {
      status: 400,
    }
  );
}