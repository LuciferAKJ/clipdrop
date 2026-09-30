import { randomUUID } from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { logger } from "./logger";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function resolveResourceType(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/") || mimeType.startsWith("audio/")) {
    return "video";
  }

  return "raw";
}

export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  mimeType: string,
) {
  const resourceType = resolveResourceType(mimeType);

  return new Promise<{
    url: string;
    publicId: string;
  }>((resolve, reject) => {
    const extension = filename.includes(".")
      ? filename.slice(filename.lastIndexOf("."))
      : "";

    const baseName = filename.includes(".")
      ? filename.slice(0, filename.lastIndexOf("."))
      : filename;

    const safeBaseName = baseName
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/^_+|_+$/g, "");

    const uniqueId = randomUUID();
    const uniqueBase = safeBaseName ? `${uniqueId}-${safeBaseName}` : uniqueId;

    const uploadOptions: Record<string, unknown> = {
      resource_type: resourceType,
      folder: "clipdrop",
      overwrite: false,
    };

    if (resourceType === "raw") {
      uploadOptions.public_id = `${uniqueBase}${extension}`;
    } else {
      uploadOptions.public_id = uniqueBase;
    }

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          logger.error("Cloudinary upload failed", error);
          return reject(error ?? new Error("Cloudinary upload failed"));
        }

        logger.debug("Cloudinary upload completed", {
          resource_type: result.resource_type,
          format: result.format,
        });

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string, mimeType: string) {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resolveResourceType(mimeType),
    type: "upload",
  });
}
