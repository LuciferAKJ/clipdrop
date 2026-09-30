import { describe, it, expect, vi, afterEach } from "vitest";
import { logger } from "@/lib/logger";
import { hashPassword, verifyPassword } from "@/lib/password";
import * as fs from "fs";
import * as path from "path";

describe("Batch 7: Logging, Dependency & Repository Cleanup", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  describe("1. Centralized Logger Functional Verification", () => {
    it("respects log levels in development mode", () => {
      (process.env as any).NODE_ENV = "development";
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      logger.debug("test debug", { count: 3 });
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[debug] test debug {"count":3}'),
      );

      logger.info("test info", { ok: true });
      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[info] test info {"ok":true}'),
      );

      logger.warn("test warn", { warning: "low" });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[warn] test warn {"warning":"low"}'),
      );

      logger.error("test error", new Error("something went wrong"));
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '[error] test error {"detail":"something went wrong"}',
        ),
      );
    });

    it("suppresses debug and info logs in production mode", () => {
      (process.env as any).NODE_ENV = "production";
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      logger.debug("suppressed debug", { secret: "do-not-log" });
      logger.info("suppressed info", { details: "do-not-log" });

      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();

      logger.warn("production warning");
      expect(warnSpy).toHaveBeenCalledWith("[warn] production warning");

      logger.error("production error", new Error("safe message"));
      expect(errorSpy).toHaveBeenCalledWith(
        '[error] production error {"detail":"safe message"}',
      );
    });
  });

  describe("2. Password Hashing Verification (bcryptjs)", () => {
    it("successfully hashes and verifies passwords using bcryptjs without bcrypt native addon", async () => {
      const password = "SuperSecretPassword123!";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword("WrongPassword!", hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe("3. Repository & Dependency Cleanliness", () => {
    it("package.json does not contain native bcrypt dependency", () => {
      const pkgPath = path.resolve(process.cwd(), "package.json");
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

      expect(pkg.dependencies.bcrypt).toBeUndefined();
      expect(pkg.dependencies.bcryptjs).toBeDefined();
      expect(pkg.devDependencies["@types/bcryptjs"]).toBeDefined();
    });

    it("dead rateLimiter.ts file does not exist", () => {
      const deadFilePath = path.resolve(process.cwd(), "lib/rateLimiter.ts");
      expect(fs.existsSync(deadFilePath)).toBe(false);
    });

    it("no source files import from native bcrypt or dead rateLimiter", () => {
      const checkDirs = ["app", "lib", "components", "hooks"];
      const forbiddenPatterns = [
        /from\s+["']bcrypt["']/,
        /require\(["']bcrypt["']\)/,
        /from\s+["'].*rateLimiter["']/,
      ];

      function scanDir(dirPath: string) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            if (entry.name !== "node_modules" && entry.name !== ".next") {
              scanDir(fullPath);
            }
          } else if (
            entry.name.endsWith(".ts") ||
            entry.name.endsWith(".tsx") ||
            entry.name.endsWith(".js")
          ) {
            const content = fs.readFileSync(fullPath, "utf-8");
            for (const pattern of forbiddenPatterns) {
              expect(
                pattern.test(content),
                `Found forbidden pattern ${pattern} in ${fullPath}`,
              ).toBe(false);
            }
          }
        }
      }

      for (const dir of checkDirs) {
        const fullDir = path.resolve(process.cwd(), dir);
        if (fs.existsSync(fullDir)) {
          scanDir(fullDir);
        }
      }
    });
  });

  describe("4. Cloudinary & Upload Logging Sanitization", () => {
    it("lib/cloudinary.ts does not log secure_url, public_id, or bytes", () => {
      const cloudinaryPath = path.resolve(process.cwd(), "lib/cloudinary.ts");
      const content = fs.readFileSync(cloudinaryPath, "utf-8");

      expect(content).not.toContain("CLOUDINARY UPLOAD RESULT:");
      expect(content).not.toContain("console.log(");
      expect(content).not.toContain("secure_url: result.secure_url");
      expect(content).not.toContain("public_id: result.public_id");
    });

    it("app/api/upload/route.ts does not log sensitive file details or raw console error dumps", () => {
      const uploadPath = path.resolve(process.cwd(), "app/api/upload/route.ts");
      const content = fs.readFileSync(uploadPath, "utf-8");

      expect(content).not.toContain("FILES RECEIVED:");
      expect(content).not.toContain("========== UPLOAD ERROR ==========");
      expect(content).not.toContain("console.log(");
      expect(content).not.toContain("console.error(");
    });
  });
});
