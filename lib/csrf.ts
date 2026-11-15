import { NextRequest } from "next/server";

/**
 * Requires a valid browser Origin on cookie-authenticated mutation routes.
 * Requests without Origin, malformed values, or cross-origin values are
 * rejected rather than treated as trusted non-browser traffic.
 */
export function isSameOriginRequest(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;

  try {
    // Compare scheme + host + port. A host-only check accepts a cross-scheme
    // Origin such as http://host against an https page.
    return new URL(origin).origin.toLowerCase() ===
      new URL(req.url).origin.toLowerCase();
  } catch {
    return false;
  }
}
