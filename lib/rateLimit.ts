import { prisma } from "./prisma";
import { hashIp } from "./ipHash";

const WINDOW_MS = 60_000;
const MAX_UPLOADS_PER_WINDOW = 10;

export class RateLimitError extends Error {
  constructor() {
    super("Too many uploads — please wait a minute and try again.");
    this.name = "RateLimitError";
  }
}

export async function checkRateLimit(ipHash: string) {
  // Skip rate limiting if the client IP couldn't be determined
  if (ipHash === hashIp("unknown")) {
    return;
  }

  const since = new Date(Date.now() - WINDOW_MS);

  const count = await prisma.share.count({
    where: {
      ipHash,
      createdAt: {
        gte: since,
      },
    },
  });

  if (count >= MAX_UPLOADS_PER_WINDOW) {
    throw new RateLimitError();
  }
}