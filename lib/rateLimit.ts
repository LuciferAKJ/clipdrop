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
 * Atomically consume one request from a fixed-window bucket.
 *
 * The three Prisma operations are safe across concurrent serverless instances:
 * - createMany + skipDuplicates initializes a missing bucket once;
 * - updateMany resets an expired bucket using a conditional write;
 * - updateMany increments only while count < max, so at most max requests
 *   can be admitted in the active window.
 *
 * No raw SQL is needed, and the counter is stored centrally in PostgreSQL.
 */
export async function consumeRateLimit(
  key: string,
  max: number,
  windowMs: number,
  errorMessage = "Too many requests — please wait a moment and try again.",
): Promise<void> {
  if (
    !key ||
    !Number.isInteger(max) ||
    max < 1 ||
    !Number.isFinite(windowMs) ||
    windowMs < 1
  ) {
    throw new Error("Invalid rate limit configuration");
  }

  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const bucketKey = hashBucketKey(key);

  await prisma.rateLimitBucket.createMany({
    data: [{ key: bucketKey, count: 0, resetAt }],
    skipDuplicates: true,
  });

  // Only one concurrent request can move an expired row into the new window.
  // Requests that arrive after this update see resetAt > now and do not reset
  // the same bucket again.
  await prisma.rateLimitBucket.updateMany({
    where: {
      key: bucketKey,
      resetAt: { lte: now },
    },
    data: {
      count: 0,
      resetAt,
    },
  });

  // This conditional increment is the admission decision. PostgreSQL applies
  // the filter and increment atomically for each matching row.
  const consumed = await prisma.rateLimitBucket.updateMany({
    where: {
      key: bucketKey,
      resetAt: { gt: now },
      count: { lt: max },
    },
    data: {
      count: { increment: 1 },
    },
  });

  if (consumed.count !== 1) {
    throw new RateLimitError(errorMessage);
  }
}

/** Shared upload limiter; retained as a stable API for the upload route. */
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
