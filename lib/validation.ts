import type { ClipboardContentType } from "@/lib/types/clipboard";

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_PREFIXES = ["image/", "video/", "audio/"];

const ALLOWED_MIME_TYPES = [
  // Documents
  "application/pdf",
  "application/msword", // doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.ms-powerpoint", // ppt
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
  "application/vnd.ms-excel", // xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "text/plain",
  "text/csv",
  "text/markdown",

  // Archives
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/vnd.rar",
  "application/x-7z-compressed",
  "application/x-tar",
  "application/gzip",
  "application/x-gzip",

  // Programming
  "text/javascript",
  "application/javascript",
  "application/typescript",
  "application/json",
  "text/html",
  "text/css",
  "text/x-python",
  "text/x-java-source",
  "text/x-c",
  "text/x-csrc",
  "text/x-c++",
  "text/x-c++src",
  "text/x-csharp",
  "text/x-go",
  "text/rust",
  "text/x-rust",
  "application/x-httpd-php",
  "text/x-php",
  "text/x-kotlin",
  "text/x-swift",
  "application/sql",
  "text/x-sql",
  "application/xml",
  "text/xml",
];

const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "txt",
  "csv",
  "md",
  "zip",
  "rar",
  "7z",
  "tar",
  "gz",
  "js",
  "ts",
  "jsx",
  "tsx",
  "json",
  "html",
  "css",
  "py",
  "java",
  "c",
  "cpp",
  "cs",
  "go",
  "rs",
  "php",
  "kt",
  "swift",
  "sql",
  "xml",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "mp3",
  "wav",
  "ogg",
  "mp4",
  "mov",
  "webm",
];

const BLOCKED_EXTENSIONS = [
  "exe",
  "bat",
  "cmd",
  "dll",
  "scr",
  "msi",
  "ps1",
  "sh",
  "com",
  "vbs",
  "jar",
];

export const MAX_DEVICE_NAME_LENGTH = 100;
const MAX_CLIENT_ID_LENGTH = 100;
const MAX_TEXT_LENGTH = 10_000;

const VALID_CONTENT_TYPES: ClipboardContentType[] = ["TEXT", "SHARE"];

export function validateTextShare(text: string) {
  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty");
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error("Text too long");
  }
}

export function validateFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File exceeds 10MB limit");
  }

  const ext = file.name?.split(".").pop()?.toLowerCase() ?? "";

  if (BLOCKED_EXTENSIONS.includes(ext)) {
    throw new Error("This file type is not allowed");
  }

  const mimePrefixAllowed = ALLOWED_MIME_PREFIXES.some((p) =>
    file.type.startsWith(p),
  );
  const mimeExactAllowed = ALLOWED_MIME_TYPES.includes(file.type);
  const extAllowed = ALLOWED_EXTENSIONS.includes(ext);

  if (!mimePrefixAllowed && !mimeExactAllowed && !extAllowed) {
    throw new Error("File type not allowed");
  }
}

export function validateDeviceRegistration(clientId: unknown, name: unknown) {
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

export function validateClipboardSync(
  contentType: unknown,
  textContent: unknown,
  shareId: unknown,
) {
  if (
    typeof contentType !== "string" ||
    !VALID_CONTENT_TYPES.includes(contentType as ClipboardContentType)
  ) {
    throw new Error("contentType must be TEXT or SHARE");
  }

  if (contentType === "TEXT") {
    if (typeof textContent !== "string" || !textContent.trim()) {
      throw new Error("textContent is required when contentType is TEXT");
    }

    if (textContent.length > MAX_TEXT_LENGTH) {
      throw new Error("textContent is too long");
    }
  }

  if (contentType === "SHARE") {
    if (typeof shareId !== "string" || !shareId.trim()) {
      throw new Error("shareId is required when contentType is SHARE");
    }
  }
}
