import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateFile, MAX_FILE_SIZE } from "@/lib/validation";
import { POST } from "@/app/api/upload/route";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { NextRequest } from "next/server";

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
  auth: vi.fn().mockResolvedValue({ userId: null }),
}));

vi.mock("@/lib/codeGen", () => ({
  generateUniqueCode: vi.fn().mockResolvedValue("SEC001"),
}));

function makeFile(name: string, type: string, buffer: Buffer): File {
  return new File([new Uint8Array(buffer)], name, { type });
}

function makeUploadReq(formData: FormData, ip = "198.51.100.99") {
  const headers = new Headers();
  headers.set("content-type", "multipart/form-data");
  headers.set("x-real-ip", ip);

  return {
    headers,
    formData: vi.fn().mockResolvedValue(formData),
    json: vi.fn().mockRejectedValue(new Error("Not JSON")),
  } as unknown as NextRequest;
}

// Sample byte signatures for valid formats
const JPEG_HEADER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);
const PNG_HEADER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52,
]);
const PDF_HEADER = Buffer.from("%PDF-1.4\n%sample valid pdf content\n");
const ZIP_HEADER = Buffer.from([
  0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00,
]);
const RAR_HEADER = Buffer.from([
  0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00, 0xcf, 0x90, 0x73,
]);
const MP3_HEADER = Buffer.from(
  "ID3\x03\x00\x00\x00\x00\x00\x00valid mp3 frame",
);
const MP4_HEADER = Buffer.from([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
]);

// Malicious / spoofed byte signatures
const WINDOWS_EXE_HEADER = Buffer.from([
  0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00,
]);
const LINUX_ELF_HEADER = Buffer.from([
  0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00,
]);
const MACHO_HEADER = Buffer.from([
  0xfe, 0xed, 0xfa, 0xce, 0x00, 0x00, 0x00, 0x01,
]);
const SHEBANG_SCRIPT = Buffer.from("#!/bin/bash\nrm -rf /");

describe("Batch 5: File Security & Content Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.share.count as any).mockResolvedValue(0);
  });

  describe("1. Valid Legitimate Formats (Direct Validation)", () => {
    it("A. Valid JPEG accepted", () => {
      const file = makeFile("photo.jpg", "image/jpeg", JPEG_HEADER);
      expect(() => validateFile(file, JPEG_HEADER)).not.toThrow();
    });

    it("B. Valid PNG accepted", () => {
      const file = makeFile("graphic.png", "image/png", PNG_HEADER);
      expect(() => validateFile(file, PNG_HEADER)).not.toThrow();
    });

    it("C. Valid PDF accepted", () => {
      const file = makeFile("document.pdf", "application/pdf", PDF_HEADER);
      expect(() => validateFile(file, PDF_HEADER)).not.toThrow();
    });

    it("D. Valid DOCX accepted", () => {
      const file = makeFile(
        "report.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ZIP_HEADER,
      );
      expect(() => validateFile(file, ZIP_HEADER)).not.toThrow();
    });

    it("E. Valid PPTX accepted", () => {
      const file = makeFile(
        "slides.pptx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ZIP_HEADER,
      );
      expect(() => validateFile(file, ZIP_HEADER)).not.toThrow();
    });

    it("F. Valid ZIP accepted", () => {
      const file = makeFile("archive.zip", "application/zip", ZIP_HEADER);
      expect(() => validateFile(file, ZIP_HEADER)).not.toThrow();
    });

    it("G. Valid RAR accepted", () => {
      const file = makeFile(
        "backup.rar",
        "application/x-rar-compressed",
        RAR_HEADER,
      );
      expect(() => validateFile(file, RAR_HEADER)).not.toThrow();
    });

    it("H. Valid MP3 accepted", () => {
      const file = makeFile("song.mp3", "audio/mpeg", MP3_HEADER);
      expect(() => validateFile(file, MP3_HEADER)).not.toThrow();
    });

    it("I. Valid MP4 accepted", () => {
      const file = makeFile("video.mp4", "video/mp4", MP4_HEADER);
      expect(() => validateFile(file, MP4_HEADER)).not.toThrow();
    });
  });

  describe("2. Security Mismatch & Spoofing Protection", () => {
    it("J. Executable binary renamed to .jpg is rejected", () => {
      const file = makeFile("trojan.jpg", "image/jpeg", WINDOWS_EXE_HEADER);
      expect(() => validateFile(file, WINDOWS_EXE_HEADER)).toThrow(
        /Executable and binary script files are not allowed|File content does not match its declared type/,
      );
    });

    it("K. Executable binary renamed to .pdf is rejected", () => {
      const file = makeFile(
        "malware.pdf",
        "application/pdf",
        WINDOWS_EXE_HEADER,
      );
      expect(() => validateFile(file, WINDOWS_EXE_HEADER)).toThrow(
        /Executable and binary script files are not allowed|File content does not match its declared type/,
      );
    });

    it("Linux ELF binary disguised as .png is rejected", () => {
      const file = makeFile("exploit.png", "image/png", LINUX_ELF_HEADER);
      expect(() => validateFile(file, LINUX_ELF_HEADER)).toThrow(
        /Executable and binary script files are not allowed/,
      );
    });

    it("Mach-O binary disguised as .zip is rejected", () => {
      const file = makeFile("payload.zip", "application/zip", MACHO_HEADER);
      expect(() => validateFile(file, MACHO_HEADER)).toThrow(
        /Executable and binary script files are not allowed/,
      );
    });

    it("Shell script disguised as .png is rejected", () => {
      const file = makeFile("image.png", "image/png", SHEBANG_SCRIPT);
      expect(() => validateFile(file, SHEBANG_SCRIPT)).toThrow(
        /File content does not match its declared type/,
      );
    });

    it("L. ZIP content renamed to .pdf is rejected due to format mismatch", () => {
      const file = makeFile("archive_fake.pdf", "application/pdf", ZIP_HEADER);
      expect(() => validateFile(file, ZIP_HEADER)).toThrow(
        /File content does not match its declared type/,
      );
    });

    it("M. Strong content/extension mismatch is rejected (PNG content renamed to .jpg)", () => {
      const file = makeFile("photo.jpg", "image/jpeg", PNG_HEADER);
      expect(() => validateFile(file, PNG_HEADER)).toThrow(
        /File content does not match its declared type/,
      );
    });

    it("N. Oversized file (> 10 MB) is rejected", () => {
      const bigFile = new File([new Uint8Array(1)], "big.pdf", {
        type: "application/pdf",
      });
      Object.defineProperty(bigFile, "size", { value: MAX_FILE_SIZE + 1 });
      expect(() => validateFile(bigFile, PDF_HEADER)).toThrow(
        /File exceeds 10MB limit/,
      );
    });

    it("O. Previously blocked extensions remain blocked (.exe, .dll, .bat, .sh)", () => {
      expect(() =>
        validateFile(
          makeFile("run.exe", "application/x-msdownload", Buffer.from("test")),
        ),
      ).toThrow(/This file type is not allowed/);

      expect(() =>
        validateFile(
          makeFile("lib.dll", "application/octet-stream", Buffer.from("test")),
        ),
      ).toThrow(/This file type is not allowed/);

      expect(() =>
        validateFile(
          makeFile("script.sh", "application/x-sh", Buffer.from("test")),
        ),
      ).toThrow(/This file type is not allowed/);
    });
  });

  describe("3. Active / Scriptable Content Policy", () => {
    it("R. HTML files (.html, .htm, text/html) are rejected", () => {
      const htmlFile = makeFile(
        "index.html",
        "text/html",
        Buffer.from("<!DOCTYPE html><html><body><h1>Hello</h1></body></html>"),
      );
      expect(() => validateFile(htmlFile)).toThrow(
        /This file type is not allowed/,
      );

      const htmFile = makeFile("index.htm", "text/html", Buffer.from("hello"));
      expect(() => validateFile(htmFile)).toThrow(
        /This file type is not allowed/,
      );
    });

    it("S. SVG files (.svg, image/svg+xml) are rejected to prevent stored XSS", () => {
      const svgFile = makeFile(
        "vector.svg",
        "image/svg+xml",
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        ),
      );
      expect(() => validateFile(svgFile)).toThrow(
        /This file type is not allowed/,
      );
    });

    it("T. XML handling: valid data XML is accepted; scriptable XML is rejected", () => {
      const validXml = Buffer.from(
        '<?xml version="1.0"?><config><item name="test"/></config>',
      );
      const validXmlFile = makeFile("data.xml", "application/xml", validXml);
      expect(() => validateFile(validXmlFile, validXml)).not.toThrow();

      // Malicious XML containing embedded script
      const maliciousXml = Buffer.from(
        '<?xml version="1.0"?><root><script>alert(document.cookie)</script></root>',
      );
      const badXmlFile = makeFile(
        "exploit.xml",
        "application/xml",
        maliciousXml,
      );
      expect(() => validateFile(badXmlFile, maliciousXml)).toThrow(
        /Scriptable content is not allowed in XML files/,
      );

      // Malicious XML embedding an SVG tag
      const svgXml = Buffer.from(
        '<?xml version="1.0"?><root><svg xmlns="http://www.w3.org/2000/svg"/></root>',
      );
      const svgXmlFile = makeFile("fake_data.xml", "application/xml", svgXml);
      expect(() => validateFile(svgXmlFile, svgXml)).toThrow(
        /Scriptable content is not allowed in XML files/,
      );
    });
  });

  describe("4. End-to-End Server Upload API Enforcement", () => {
    it("P. Multi-file upload with one spoofed file performs zero Cloudinary uploads and creates no DB records", async () => {
      const goodFile = makeFile("valid.png", "image/png", PNG_HEADER);
      const spoofedFile = makeFile(
        "fake.jpg",
        "image/jpeg",
        WINDOWS_EXE_HEADER,
      );

      const formData = new FormData();
      formData.append("files", goodFile);
      formData.append("files", spoofedFile);

      const req = makeUploadReq(formData);
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(
        /Executable and binary script files are not allowed|File content does not match its declared type/,
      );

      // Verify Cloudinary and Prisma were completely untouched
      expect(uploadToCloudinary).not.toHaveBeenCalled();
      expect(prisma.share.create).not.toHaveBeenCalled();
    });

    it("Q. Invalid content discovered upfront creates no orphan Share or File rows", async () => {
      const mismatchedFile = makeFile(
        "document.pdf",
        "application/pdf",
        ZIP_HEADER,
      );

      const formData = new FormData();
      formData.append("files", mismatchedFile);

      const req = makeUploadReq(formData);
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(
        /File content does not match its declared type/,
      );

      expect(uploadToCloudinary).not.toHaveBeenCalled();
      expect(prisma.share.create).not.toHaveBeenCalled();
    });
  });
});
