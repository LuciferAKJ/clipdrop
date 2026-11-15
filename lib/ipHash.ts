import { createHmac } from "crypto";
import { NextRequest } from "next/server";

export function getClientIp(req: NextRequest): string {
  // 1. Vercel edge sets x-real-ip directly to the connecting client's IP.
  // This header is overwritten by Vercel edge and cannot be spoofed by incoming client headers.
  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  // 2. Vercel proxied header
  const vercelProxied = req.headers.get("x-vercel-proxied-for");
  if (vercelProxied && vercelProxied.trim()) {
    return vercelProxied.split(",")[0].trim();
  }

  // 3. NextRequest.ip property populated by Next.js server runtime
  // @ts-expect-error ip property is present on NextRequest in server runtime
  if (typeof req.ip === "string" && req.ip.trim()) {
    // @ts-expect-error ip property
    return req.ip.trim();
  }

  // Do not trust x-forwarded-for directly: clients can supply this header
  // when the app is reached outside a trusted proxy chain. Unknown requests
  // share a single fail-closed bucket rather than gaining a spoofable identity.
  return "unknown";
}

export function hashIp(ip: string): string {
  const pepper = process.env.IP_HASH_PEPPER?.trim();

  if (
    process.env.NODE_ENV === "production" &&
    (!pepper || pepper.length < 32)
  ) {
    throw new Error(
      "IP_HASH_PEPPER must be configured in production with at least 32 characters",
    );
  }

  // A fixed development-only key keeps local tests deterministic. Production
  // requests must use a separately generated secret from the deployment's
  // environment; HMAC prevents straightforward offline IP dictionary checks.
  const key = pepper || "clipdrop-local-development-only-ip-hash-key";
  return createHmac("sha256", key).update(ip, "utf8").digest("hex");
}
