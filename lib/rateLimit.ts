import { createHash } from "crypto";
import { prisma } from "./prisma";
import {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_UPLOAD_MAX,
} from "./constants";

export class RateLimitError extends Error {
  constructor(
    message = "Too many requests — please wait a moment and try again.",
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Hash rate-limit identifiers before storing them. Callers should pass
 * already-normalized keys (for example, an IP hash or authenticated user id);
 * the database never needs the original identifier.
 */
function hashBucketKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Atomically consume one request from a fixed-window bucket in PostgreSQL.
 * The INSERT .. ON CONFLICT statement makes initialization, window reset,
 * and increments safe across concurrent requests and independent Vercel
 * function instances. A full active bucket returns no row.
 */
export async function consumeRateLimit(
  key: string,
  max: number,
  windowMs: number,
  errorMessage = "Too many requests — please wait a moment and try again.",
): Promise<void> {
  if (!key || !Number.isInteger(max) || max < 1 || !Number.isFinite(windowMs) || windowMs < 1) {
    throw new Error("Invalid rate limit configuration");
  }

  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const bucketKey = hashBucketKey(key);

  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RateLimitBucket"
      ("key", "count", "resetAt", "createdAt", "updatedAt")
    VALUES
      (${bucketKey}, 1, ${resetAt}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("key") DO UPDATE
    SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= ${now} THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= ${now} THEN ${resetAt}
        ELSE "RateLimitBucket"."resetAt"
      END,
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE
      "RateLimitBucket"."resetAt" <= ${now}
      OR "RateLimitBucket"."count" < ${max}
    RETURNING "count"
  `;

  if (rows.length === 0) {
    throw new RateLimitError(errorMessage);
  }
}

/** Retain the existing upload limiter API, now backed by shared DB state. */
export async function checkRateLimit(ipHash: string): Promise<void> {
  await consumeRateLimit(
    `upload:${ipHash}`,
    RATE_LIMIT_UPLOAD_MAX,
    RATE_LIMIT_WINDOW_MS,
    "Too many uploads — please wait a minute and try again.",
  );
}

/** Password attempts are counted before verification, atomically. */
export async function checkPasswordRateLimit(
  key: string,
  max = 5,
): Promise<void> {
  await consumeRateLimit(
    key,
    max,
    5 * 60 * 1000,
    "Too many failed password attempts. Please wait 5 minutes.",
  );
}

/** Clear a successful password check so a user is not locked out by old typos. */
export async function clearPasswordAttempts(key: string): Promise<void> {
  await prisma.rateLimitBucket.deleteMany({
    where: { key: hashBucketKey(key) },
  });
}
