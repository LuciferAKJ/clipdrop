import { NextRequest } from "next/server";

/**
 * Checks the browser Origin against the request Host for cookie-authenticated
 * mutation routes. Non-browser clients that omit Origin remain supported;
 * malformed or cross-origin values are rejected.
 */
export function isSameOriginRequest(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;

  const host = req.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}
