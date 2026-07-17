import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string
) {
  return new Promise<{
    url: string;
    publicId: string;
  }>((resolve, reject) => {

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "clipdrop",
        filename_override: filename,
      },
      (error, result) => {

        if (error || !result) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(
  publicId: string
) {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
  });
}