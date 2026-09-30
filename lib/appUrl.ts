/**
 * Resolves the canonical base URL for the application.
 * Priority:
 * 1. Explicitly configured NEXT_PUBLIC_APP_URL (ignoring default template placeholders)
 * 2. Vercel deployment URLs (VERCEL_PROJECT_PRODUCTION_URL or VERCEL_URL)
 * 3. Localhost fallback for local development
 */
export function getAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && envUrl.trim() && !envUrl.includes("your-app.vercel.app")) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
