import { prisma } from "./prisma";
import { RATE_LIMIT_WINDOW_MS } from "./constants";

export class RateLimitError extends Error {
  constructor(
    message = "Too many requests — please wait a moment and try again",
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Generic ipHash-based rate limiter over the Share table (the only
 * table with an ipHash column today). Reused by any endpoint keyed on
 * "uploads per IP per window" — currently just /api/upload.
 */
export async function checkShareRateLimit(ipHash: string, max: number) {
  if (!ipHash) return; // can't rate-limit an unknown IP; fail open rather than block everyone

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const count = await prisma.share.count({
    where: { ipHash, createdAt: { gte: since } },
  });

  if (count >= max) {
    throw new RateLimitError();
  }
}

/**
 * Generic per-user rate limiter over the Device table's lastSeenAt,
 * usable for endpoints that don't have an ipHash column to key off
 * (clipboard, device registration) — keyed on userId instead, since
 * those routes are already auth-required.
 */
export async function checkUserActionRateLimit(
  userId: string,
  windowMs: number,
  max: number,
  countFn: (since: Date) => Promise<number>,
) {
  const since = new Date(Date.now() - windowMs);
  const count = await countFn(since);
  if (count >= max) {
    throw new RateLimitError();
  }
}
