import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Prisma Schema Data Integrity & Relations (prisma/schema.prisma)", () => {
  const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
  const schemaContent = fs.readFileSync(schemaPath, "utf-8");

  it("Share.user specifies onDelete: SetNull so shares remain accessible anonymously", () => {
    expect(schemaContent).toMatch(
      /user\s+User\?\s+@relation\(fields:\s*\[userId\],\s*references:\s*\[id\],\s*onDelete:\s*SetNull\)/,
    );
  });

  it("Device.user specifies onDelete: Cascade so devices are cleaned up on user deletion", () => {
    expect(schemaContent).toMatch(
      /model\s+Device\s+\{[\s\S]*?user\s+User\s+@relation\(fields:\s*\[userId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)[\s\S]*?\}/,
    );
  });

  it("ClipboardSync.user specifies onDelete: Cascade so sync records are removed on user deletion", () => {
    expect(schemaContent).toMatch(
      /model\s+ClipboardSync\s+\{[\s\S]*?user\s+User\s+@relation\(fields:\s*\[userId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)[\s\S]*?\}/,
    );
  });

  it("File.share specifies onDelete: Cascade so file rows are purged on share deletion", () => {
    expect(schemaContent).toMatch(
      /model\s+File\s+\{[\s\S]*?share\s+Share\s+@relation\(fields:\s*\[shareId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)[\s\S]*?\}/,
    );
  });

  it("File model includes index on shareId to accelerate related file lookups and cascades", () => {
    expect(schemaContent).toMatch(
      /model\s+File\s+\{[\s\S]*?@@index\(\[shareId\]\)[\s\S]*?\}/,
    );
  });

  it("Share model includes index on (userId, createdAt DESC) for dashboard listing queries", () => {
    expect(schemaContent).toMatch(
      /@@index\(\[userId,\s*createdAt\(sort:\s*Desc\)\]\)/,
    );
  });

  it("Share model includes composite index on (ipHash, createdAt) for upload rate-limiting", () => {
    expect(schemaContent).toMatch(/@@index\(\[ipHash,\s*createdAt\]\)/);
  });

  it("Preserves existing required indexes on Share (expiresAt, ipHash)", () => {
    expect(schemaContent).toMatch(/@@index\(\[expiresAt\]\)/);
    expect(schemaContent).toMatch(/@@index\(\[ipHash\]\)/);
  });
});
