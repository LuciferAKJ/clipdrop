import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateUniqueCode } from "@/lib/codeGen";
import {
  validateTextShare,
  validateFile,
  UploadValidationError,
} from "@/lib/validation";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import { hashPassword } from "@/lib/password";
import { auth } from "@clerk/nextjs/server";
import { getClientIp, hashIp } from "@/lib/ipHash";
import { checkRateLimit, RateLimitError } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

const EXPIRY_OPTIONS: Record<string, number> = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "12h": 12 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "3d": 3 * 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

const ALLOWED_DOWNLOAD_LIMITS = [1, 5, 10, 25, 50, 100];

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json(
            { error: "Cross-origin request rejected" },
            { status: 403 },
          );
        }
      } catch {
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
      }
    }

    const { userId } = await auth();

    const ipHash = hashIp(getClientIp(req));

    try {
      await checkRateLimit(ipHash);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json({ error: error.message }, { status: 429 });
      }

      throw error;
    }

    const type = req.headers.get("content-type") || "";

    const code = await generateUniqueCode();

    // =========================
    // FILE UPLOAD (MULTIPART)
    // =========================

    if (type.includes("multipart/form-data")) {
      const formData = await req.formData();

      const rawFiles = formData.getAll("files");
      if (!rawFiles.every((value): value is File => value instanceof File)) {
        throw new UploadValidationError("Invalid file upload");
      }
      const files = rawFiles;

      logger.debug("Files received for upload", {
        count: files.length,
      });

      const rawText = formData.get("text");
      const rawPassword = formData.get("password");
      if (rawText !== null && typeof rawText !== "string") {
        throw new UploadValidationError("Invalid text field");
      }
      if (rawPassword !== null && typeof rawPassword !== "string") {
        throw new UploadValidationError("Invalid password field");
      }
      const text = rawText;
      const password = rawPassword;
      const oneTimeUse = formData.get("oneTimeUse") === "true";
      const downloadLimitRaw = formData.get("downloadLimit") as string | null;
      const expiryRaw = formData.get("expiry") as string | null;

      if (expiryRaw && !Object.hasOwn(EXPIRY_OPTIONS, expiryRaw)) {
        return NextResponse.json({ error: "Invalid expiry" }, { status: 400 });
      }

      let downloadLimit: number | null = null;
      if (downloadLimitRaw !== null && downloadLimitRaw !== "") {
        const parsed = Number(downloadLimitRaw);
        if (!ALLOWED_DOWNLOAD_LIMITS.includes(parsed)) {
          return NextResponse.json(
            { error: "Invalid download limit" },
            { status: 400 },
          );
        }
        downloadLimit = parsed;
      }

      if (oneTimeUse && downloadLimit === null) {
        downloadLimit = 1;
      }

      const expiryKey = (expiryRaw as keyof typeof EXPIRY_OPTIONS) ?? "1h";

      const expiresAt = new Date(Date.now() + EXPIRY_OPTIONS[expiryKey]);

      const passwordHash = password ? await hashPassword(password) : null;

      if (!files.length && !text) {
        throw new UploadValidationError("Nothing uploaded");
      }

      if (text) {
        validateTextShare(text);
      }

      // Pre-read and validate ALL files (including content signatures) before any Cloudinary upload or Share creation
      const fileBuffers: Buffer[] = [];
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        validateFile(file, buffer);
        fileBuffers.push(buffer);
      }

      const share = await prisma.share.create({
        data: {
          code,
          textContent: text,
          expiresAt,
          passwordHash,
          oneTimeUse,
          downloadLimit,
          userId: userId ?? null,
          ipHash,
        },
      });

      const uploadedCloudinaryAssets: {
        publicId: string;
        mimeType: string;
        url: string;
        sizeBytes: number;
        originalName: string;
        fileRecordPersisted: boolean;
      }[] = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const buffer = fileBuffers[i];

          const uploaded = await uploadToCloudinary(
            buffer,
            file.name,
            file.type,
          );
          const asset = {
            publicId: uploaded.publicId,
            mimeType: file.type,
            url: uploaded.url,
            sizeBytes: file.size,
            originalName: file.name,
            fileRecordPersisted: false,
          };
          uploadedCloudinaryAssets.push(asset);

          await prisma.file.create({
            data: {
              shareId: share.id,
              url: asset.url,
              publicId: asset.publicId,
              mimeType: asset.mimeType,
              sizeBytes: asset.sizeBytes,
              originalName: asset.originalName,
            },
          });
          asset.fileRecordPersisted = true;
        }
      } catch (uploadError) {
        // Rollback on failure: delete uploaded assets from Cloudinary
        await Promise.allSettled(
          uploadedCloudinaryAssets.map((asset) =>
            deleteFromCloudinary(asset.publicId, asset.mimeType),
          ),
        );

        // Delete the created share (cascading to any created File rows in DB)
        await prisma.share
          .delete({
            where: { id: share.id },
          })
          .catch((delErr) => {
            logger.error("Failed to delete share during rollback", delErr);
          });

        throw uploadError;
      }

      return NextResponse.json({ code: share.code }, { status: 201 });
    }

    // =========================
    // TEXT ONLY JSON UPLOAD
    // =========================

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new UploadValidationError("Invalid request body");
    }

    const { text, password, oneTimeUse, downloadLimit, expiry } = body;

    validateTextShare(text);

    if (expiry && !Object.hasOwn(EXPIRY_OPTIONS, expiry)) {
      return NextResponse.json({ error: "Invalid expiry" }, { status: 400 });
    }

    let parsedDownloadLimit: number | null = null;
    if (
      downloadLimit !== undefined &&
      downloadLimit !== null &&
      downloadLimit !== ""
    ) {
      const parsed = Number(downloadLimit);
      if (!ALLOWED_DOWNLOAD_LIMITS.includes(parsed)) {
        return NextResponse.json(
          { error: "Invalid download limit" },
          { status: 400 },
        );
      }
      parsedDownloadLimit = parsed;
    }

    if (oneTimeUse && parsedDownloadLimit === null) {
      parsedDownloadLimit = 1;
    }

    const expiryKey = (expiry as keyof typeof EXPIRY_OPTIONS) ?? "1h";

    const expiresAt = new Date(Date.now() + EXPIRY_OPTIONS[expiryKey]);

    const passwordHash = password ? await hashPassword(password) : null;

    const share = await prisma.share.create({
      data: {
        code,
        textContent: text,
        expiresAt,
        passwordHash,
        oneTimeUse: !!oneTimeUse,
        downloadLimit: parsedDownloadLimit,
        userId: userId ?? null,
        ipHash,
      },
    });

    return NextResponse.json({ code: share.code }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logger.error("Upload failed due to an unexpected server error", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
