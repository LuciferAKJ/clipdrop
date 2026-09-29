import { createHash } from "crypto";
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

  // 4. x-forwarded-for fallback
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);
    if (ips.length > 0) {
      return ips[0];
    }
  }

  return "unknown";
}

export function hashIp(ip: string): string {
  const pepper = process.env.IP_HASH_PEPPER || "";
  return createHash("sha256")
    .update(ip + pepper)
    .digest("hex");
}
