import { NextRequest } from "next/server";

/**
 * Checks the browser Origin against the request Host for cookie-authenticated
 * mutation routes. Non-browser clients that omit Origin remain supported;
 * malformed or cross-origin values are rejected.
 */
export function isSameOriginRequest(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;

  try {
    // Compare scheme + host + port. A host-only check accepts a cross-scheme
    // Origin such as http://host against an https page.
    return new URL(origin).origin.toLowerCase() ===
      new URL(req.url).origin.toLowerCase();
  } catch {
    return false;
  }
}
