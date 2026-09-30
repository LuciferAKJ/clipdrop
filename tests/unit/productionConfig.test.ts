import { describe, it, expect, vi, beforeEach } from "vitest";
import nextConfig from "@/next.config";
import { getAppUrl } from "@/lib/appUrl";
import { NextRequest } from "next/server";
import { POST as uploadPOST } from "@/app/api/upload/route";
import { DELETE as dashboardDELETE } from "@/app/api/dashboard/delete/route";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    share: {
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
    file: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/cloudinary", () => ({
  uploadToCloudinary: vi.fn(),
  deleteFromCloudinary: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_test_123" }),
}));

describe("Batch 6: Production Security Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  describe("1. Security Headers & HSTS", () => {
    it("A. nextConfig defines essential security headers", async () => {
      expect(nextConfig.headers).toBeDefined();
      const headerRules = await nextConfig.headers!();
      expect(headerRules.length).toBeGreaterThan(0);

      const rootHeaders = headerRules.find(
        (r) => r.source === "/:path*",
      )?.headers;
      expect(rootHeaders).toBeDefined();

      const headerMap = new Map(rootHeaders!.map((h) => [h.key, h.value]));

      expect(headerMap.get("X-Content-Type-Options")).toBe("nosniff");
      expect(headerMap.get("X-Frame-Options")).toBe("DENY");
      expect(headerMap.get("Referrer-Policy")).toBe(
        "strict-origin-when-cross-origin",
      );
      expect(headerMap.get("Permissions-Policy")).toContain("camera=()");
      expect(headerMap.get("Permissions-Policy")).toContain("microphone=()");
      expect(headerMap.get("Permissions-Policy")).toContain("geolocation=()");
      expect(headerMap.get("Content-Security-Policy")).toBeDefined();
    });

    it("B. CSP restricts sources and avoids broad * wildcards", async () => {
      const headerRules = await nextConfig.headers!();
      const rootHeaders = headerRules.find(
        (r) => r.source === "/:path*",
      )?.headers;
      const csp = rootHeaders?.find(
        (h) => h.key === "Content-Security-Policy",
      )?.value;

      expect(csp).toBeDefined();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'self'");
      expect(csp).toContain("https://res.cloudinary.com");
      expect(csp).toContain("https://*.clerk.accounts.dev");
      expect(csp).toContain("https://*.clerk.com");
      expect(csp).toContain("https://challenges.cloudflare.com");

      // Verify no open-ended standalone wildcard origins like 'script-src *' or 'connect-src *'
      expect(csp).not.toMatch(/script-src\s+[^;]*(?:^|\s)\*(?:\s|;|$)/);
      expect(csp).not.toMatch(/connect-src\s+[^;]*(?:^|\s)\*(?:\s|;|$)/);
    });
  });

  describe("2. Canonical Production URL Resolution", () => {
    it("K. Resolves explicit NEXT_PUBLIC_APP_URL when valid", () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://clipdrop.net";
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      delete process.env.VERCEL_URL;

      expect(getAppUrl()).toBe("https://clipdrop.net");
    });

    it("K. Ignores template placeholder 'your-app.vercel.app' and uses Vercel production URL", () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://your-app.vercel.app";
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "real-clipdrop.vercel.app";

      expect(getAppUrl()).toBe("https://real-clipdrop.vercel.app");
    });

    it("K. Falls back to localhost only in local development when no env vars set", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      delete process.env.VERCEL_URL;

      expect(getAppUrl()).toBe("http://localhost:3000");
    });
  });

  describe("3. CSRF & Cross-Origin Rejection", () => {
    it("E & F. State-changing upload rejects cross-origin request from foreign origin", async () => {
      const formData = new FormData();
      formData.append("text", "hello world");

      const req = {
        headers: new Headers({
          "content-type": "multipart/form-data",
          host: "clipdrop.net",
          origin: "https://evil-attacker.com",
        }),
        formData: vi.fn().mockResolvedValue(formData),
      } as unknown as NextRequest;

      const res = await uploadPOST(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Cross-origin request rejected");
    });

    it("E & F. State-changing upload accepts same-origin request", async () => {
      const formData = new FormData();
      formData.append("text", "hello world");

      (prisma.share.count as any).mockResolvedValue(0);
      (prisma.share.create as any).mockResolvedValue({
        id: "s1",
        code: "CODE01",
      });

      const req = {
        headers: new Headers({
          "content-type": "multipart/form-data",
          host: "clipdrop.net",
          origin: "https://clipdrop.net",
        }),
        formData: vi.fn().mockResolvedValue(formData),
      } as unknown as NextRequest;

      const res = await uploadPOST(req);
      expect(res.status).toBe(201);
    });

    it("E & F. State-changing dashboard delete rejects cross-origin request", async () => {
      const req = {
        headers: new Headers({
          host: "clipdrop.net",
          origin: "https://evil-attacker.com",
        }),
        json: vi.fn().mockResolvedValue({ shareId: "s1" }),
      } as unknown as NextRequest;

      const res = await dashboardDELETE(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Cross-origin request rejected");
    });
  });

  describe("4. Environment Variable Security", () => {
    it("D. Confirms no sensitive secrets are prefixed with NEXT_PUBLIC_", () => {
      const allKeys = Object.keys(process.env);
      const publicKeys = allKeys.filter((k) => k.startsWith("NEXT_PUBLIC_"));

      const secretNames = [
        "SECRET",
        "KEY",
        "PASSWORD",
        "DATABASE",
        "PEPPER",
        "TOKEN",
      ];

      for (const pk of publicKeys) {
        // NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is explicitly intended to be public
        if (pk === "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") continue;

        for (const secretWord of secretNames) {
          expect(
            pk.toUpperCase(),
            `Public env var ${pk} must not contain sensitive term ${secretWord}`,
          ).not.toContain(secretWord);
        }
      }
    });
  });
});
