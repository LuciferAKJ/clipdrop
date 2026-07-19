export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_MIME_PREFIXES = [
  "image/",
  "video/",
  "audio/",
  "application/pdf",
  "application/zip",
  "application/octet-stream",
];

export const MAX_DEVICE_NAME_LENGTH = 100;
const MAX_CLIENT_ID_LENGTH = 100;

export function validateTextShare(text: string) {
  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty");
  }

  if (text.length > 10000) {
    throw new Error("Text too long");
  }
}

export function validateFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File exceeds 10MB limit");
  }

  const allowed = ALLOWED_MIME_PREFIXES.some((prefix) =>
    file.type.startsWith(prefix)
  );

  if (!allowed) {
    throw new Error("File type not allowed");
  }
}

export function validateDeviceRegistration(
  clientId: unknown,
  name: unknown
) {
  if (typeof clientId !== "string" || !clientId.trim()) {
    throw new Error("clientId is required");
  }

  if (clientId.length > MAX_CLIENT_ID_LENGTH) {
    throw new Error("clientId is invalid");
  }

  if (typeof name !== "string" || !name.trim()) {
    throw new Error("name is required");
  }

  if (name.length > MAX_DEVICE_NAME_LENGTH) {
    throw new Error("name is too long");
  }
}

export function validateDeviceName(name: unknown) {
  if (typeof name !== "string" || !name.trim()) {
    throw new Error("name is required");
  }

  if (name.length > MAX_DEVICE_NAME_LENGTH) {
    throw new Error("name is too long");
  }
}