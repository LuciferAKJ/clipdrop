import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { validateDeviceRegistration } from "@/lib/validation";
import { unauthorized, badRequest, ok } from "@/lib/apiResponses";
import { logger } from "@/lib/logger";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const devices = await prisma.device.findMany({
    where: { userId },
    orderBy: { lastSeenAt: "desc" },
  });

  return ok({ devices });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body) return badRequest("Invalid request body");

  const { clientId, name } = body;

  try {
    validateDeviceRegistration(clientId, name);
  } catch (err) {
    return badRequest(err instanceof Error ? err.message : "Invalid input");
  }

  try {
    await prisma.device.upsert({
      where: { userId_clientId: { userId, clientId } },
      update: { lastSeenAt: new Date() },
      create: { userId, clientId, name },
    });
  } catch (err) {
    logger.error("Device upsert failed", err);
    throw err; // let Next.js's default error boundary handle the 500; withErrorHandling not used here since this is the only DB call
  }

  return ok({ success: true });
}
