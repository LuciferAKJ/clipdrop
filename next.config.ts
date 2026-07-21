import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js dev/HMR needs unsafe-eval; tighten in a follow-up once confirmed safe to drop in prod
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://res.cloudinary.com data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://res.cloudinary.com https://*.clerk.accounts.dev",
      "frame-src https://*.clerk.accounts.dev",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
