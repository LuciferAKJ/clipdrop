import { prisma } from "./prisma";
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_UPLOAD_MAX } from "./constants";

const WINDOW_MS = RATE_LIMIT_WINDOW_MS;
const MAX_UPLOADS_PER_WINDOW = RATE_LIMIT_UPLOAD_MAX;

export class RateLimitError extends Error {
  constructor(
    message = "Too many uploads — please wait a minute and try again.",
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

export async function checkRateLimit(ipHash: string) {
  // Never bypass unknown IPs: requests with unknown IP share a single rate-limit bucket
  // to prevent header stripping/spoofing from granting unlimited uploads.
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

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitBucket>();

// Clean up expired buckets periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, bucket] of memoryStore.entries()) {
        if (bucket.resetAt <= now) {
          memoryStore.delete(key);
        }
      }
    },
    5 * 60 * 1000,
  ).unref?.();
}

export function checkMemoryRateLimit(
  key: string,
  max: number,
  windowMs: number,
  errorMessage = "Too many requests — please wait a moment and try again.",
) {
  const now = Date.now();
  const bucket = memoryStore.get(key);

  if (!bucket || bucket.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (bucket.count >= max) {
    throw new RateLimitError(errorMessage);
  }

  bucket.count++;
}

export function checkPasswordRateLimit(key: string, max = 5) {
  const now = Date.now();
  const bucket = memoryStore.get(key);
  if (bucket && bucket.resetAt > now && bucket.count >= max) {
    throw new RateLimitError(
      "Too many failed password attempts. Please wait 5 minutes.",
    );
  }
}

export function recordFailedPasswordAttempt(
  key: string,
  windowMs = 5 * 60 * 1000,
) {
  const now = Date.now();
  const bucket = memoryStore.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count++;
}

export function clearPasswordAttempts(key: string) {
  memoryStore.delete(key);
}
