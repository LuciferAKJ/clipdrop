import type { ClipboardContentType } from "@/lib/types/clipboard";
import { MAX_TEXT_LENGTH } from "@/lib/constants";
import { filetypeinfo } from "magic-bytes.js";

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

  // Programming / Plain Text
  "text/javascript",
  "application/javascript",
  "application/typescript",
  "application/json",
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

  // Images, video, audio
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "video/mp4",
  "video/quicktime",
  "video/webm",
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
  "html",
  "htm",
  "svg",
  "xhtml",
  "hta",
  "cpl",
  "pif",
  "iso",
  "bin",
  "vbe",
  "jse",
  "wsf",
  "wsh",
  "msc",
];

export const MAX_DEVICE_NAME_LENGTH = 100;
const MAX_CLIENT_ID_LENGTH = 100;
export { MAX_TEXT_LENGTH };

const VALID_CONTENT_TYPES: ClipboardContentType[] = ["TEXT", "SHARE"];

export function validateTextShare(text: string) {
  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty");
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error("Text too long");
  }
}

/**
 * Validates the file buffer content against magic bytes and format signatures.
 */
function validateFileContent(
  ext: string,
  _mime: string,
  buffer: Buffer | Uint8Array,
) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  if (bytes.length === 0) {
    const textExtensions = [
      "txt",
      "md",
      "csv",
      "json",
      "js",
      "ts",
      "css",
      "py",
      "sql",
      "xml",
    ];
    if (!textExtensions.includes(ext)) {
      throw new Error("Invalid empty file content");
    }
    return;
  }

  // 1. Immediate rejection of executable and binary script signatures
  // Windows DOS/PE (MZ)
  if (bytes.length >= 2 && bytes[0] === 0x4d && bytes[1] === 0x5a) {
    throw new Error("Executable and binary script files are not allowed");
  }

  // Linux ELF
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x7f &&
    bytes[1] === 0x45 &&
    bytes[2] === 0x4c &&
    bytes[3] === 0x46
  ) {
    throw new Error("Executable and binary script files are not allowed");
  }

  // Mach-O binaries (32-bit & 64-bit, big & little endian, universal fat binary)
  if (bytes.length >= 4) {
    const isMacho =
      (bytes[0] === 0xfe &&
        bytes[1] === 0xed &&
        bytes[2] === 0xfa &&
        (bytes[3] === 0xce || bytes[3] === 0xcf)) ||
      (bytes[0] === 0xce &&
        bytes[1] === 0xfa &&
        bytes[2] === 0xed &&
        bytes[3] === 0xfe) ||
      (bytes[0] === 0xcf &&
        bytes[1] === 0xfa &&
        bytes[2] === 0xed &&
        bytes[3] === 0xfe) ||
      (bytes[0] === 0xca &&
        bytes[1] === 0xfe &&
        bytes[2] === 0xba &&
        bytes[3] === 0xbe);
    if (isMacho) {
      throw new Error("Executable and binary script files are not allowed");
    }
  }

  // Shell script shebang (#!) disguised as media or document
  if (bytes.length >= 2 && bytes[0] === 0x23 && bytes[1] === 0x21) {
    const binaryMediaExts = [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "gif",
      "pdf",
      "zip",
      "rar",
      "7z",
      "tar",
      "gz",
      "docx",
      "pptx",
      "xlsx",
      "doc",
      "ppt",
      "xls",
      "mp3",
      "wav",
      "ogg",
      "mp4",
      "mov",
      "webm",
    ];
    if (binaryMediaExts.includes(ext)) {
      throw new Error("File content does not match its declared type");
    }
  }

  // 2. High-risk structured formats: exact signature checks
  if (ext === "jpg" || ext === "jpeg") {
    // JPEG starts with FF D8 FF
    if (
      bytes.length < 3 ||
      bytes[0] !== 0xff ||
      bytes[1] !== 0xd8 ||
      bytes[2] !== 0xff
    ) {
      throw new Error("File content does not match its declared type");
    }
    return;
  }

  if (ext === "png") {
    // PNG starts with 89 50 4E 47 0D 0A 1A 0A
    const pngMagic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    if (bytes.length < 8 || !pngMagic.every((b, i) => bytes[i] === b)) {
      throw new Error("File content does not match its declared type");
    }
    return;
  }

  if (ext === "gif") {
    // GIF starts with GIF87a or GIF89a
    if (bytes.length < 6)
      throw new Error("File content does not match its declared type");
    const header = Buffer.from(bytes.subarray(0, 6)).toString("ascii");
    if (header !== "GIF87a" && header !== "GIF89a") {
      throw new Error("File content does not match its declared type");
    }
    return;
  }

  if (ext === "webp") {
    // WebP starts with RIFF and bytes 8-11 are WEBP
    if (bytes.length < 12)
      throw new Error("File content does not match its declared type");
    const riff = Buffer.from(bytes.subarray(0, 4)).toString("ascii");
    const webp = Buffer.from(bytes.subarray(8, 12)).toString("ascii");
    if (riff !== "RIFF" || webp !== "WEBP") {
      throw new Error("File content does not match its declared type");
    }
    return;
  }

  if (ext === "pdf") {
    // PDF starts with %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
    if (bytes.length < 5)
      throw new Error("File content does not match its declared type");
    const header = Buffer.from(bytes.subarray(0, 5)).toString("ascii");
    if (header !== "%PDF-") {
      throw new Error("File content does not match its declared type");
    }
    return;
  }

  if (ext === "zip") {
    // ZIP starts with PK\x03\x04 or PK\x05\x06 or PK\x07\x08
    if (
      bytes.length < 4 ||
      bytes[0] !== 0x50 ||
      bytes[1] !== 0x4b ||
      (bytes[2] !== 0x03 && bytes[2] !== 0x05 && bytes[2] !== 0x07)
    ) {
      throw new Error("File content does not match its declared type");
    }
    return;
  }

  if (ext === "docx" || ext === "pptx" || ext === "xlsx") {
    // Office OOXML files are ZIP containers starting with PK\x03\x04
    if (
      bytes.length < 4 ||
      bytes[0] !== 0x50 ||
      bytes[1] !== 0x4b ||
      bytes[2] !== 0x03 ||
      bytes[3] !== 0x04
    ) {
      throw new Error("File content does not match its declared type");
    }
    return;
  }

  if (ext === "doc" || ext === "ppt" || ext === "xls") {
    // OLE Compound File Binary (D0 CF 11 E0 A1 B1 1A E1)
    const oleMagic = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
    if (bytes.length < 8 || !oleMagic.every((b, i) => bytes[i] === b)) {
      throw new Error("File content does not match its declared type");
    }
    return;
  }

  if (ext === "rar") {
    // RAR starts with Rar!\x1a\x07
    const rarMagic = [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07];
    if (bytes.length < 6 || !rarMagic.every((b, i) => bytes[i] === b)) {
      throw new Error("File content does not match its declared type");
    }
    return;
  }

  if (ext === "7z") {
    // 7z starts with 37 7A BC AF 27 1C
    const sevenZMagic = [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c];
    if (bytes.length < 6 || !sevenZMagic.every((b, i) => bytes[i] === b)) {
      throw new Error("File content does not match its declared type");
    }
    return;
  }

  if (ext === "gz") {
    // GZIP starts with 1F 8B
    if (bytes.length < 2 || bytes[0] !== 0x1f || bytes[1] !== 0x8b) {
      throw new Error("File content does not match its declared type");
    }
    return;
  }

  if (ext === "tar") {
    if (bytes.length >= 262) {
      const ustar = Buffer.from(bytes.subarray(257, 262)).toString("ascii");
      if (ustar !== "ustar") {
        throw new Error("File content does not match its declared type");
      }
    }
    return;
  }

  if (ext === "mp3") {
    const isId3 =
      bytes.length >= 3 &&
      bytes[0] === 0x49 &&
      bytes[1] === 0x44 &&
      bytes[2] === 0x33;
    const isSync =
      bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
    if (!isId3 && !isSync) {
      throw new Error("File content does not match its declared type");
    }
    return;
  }

  if (ext === "wav") {
    if (bytes.length < 12)
      throw new Error("File content does not match its declared type");
    const riff = Buffer.from(bytes.subarray(0, 4)).toString("ascii");
    const wave = Buffer.from(bytes.subarray(8, 12)).toString("ascii");
    if (riff !== "RIFF" || wave !== "WAVE") {
      throw new Error("File content does not match its declared type");
    }
    return;
  }

  if (ext === "ogg") {
    if (
      bytes.length < 4 ||
      bytes[0] !== 0x4f ||
      bytes[1] !== 0x67 ||
      bytes[2] !== 0x67 ||
      bytes[3] !== 0x53
    ) {
      throw new Error("File content does not match its declared type");
    }
    return;
  }

  if (ext === "mp4" || ext === "mov") {
    if (bytes.length < 8)
      throw new Error("File content does not match its declared type");
    const brand = Buffer.from(bytes.subarray(4, 8)).toString("ascii");
    if (
      brand !== "ftyp" &&
      brand !== "moov" &&
      brand !== "mdat" &&
      brand !== "wide"
    ) {
      throw new Error("File content does not match its declared type");
    }
    return;
  }

  if (ext === "webm") {
    const ebml = [0x1a, 0x45, 0xdf, 0xa3];
    if (bytes.length < 4 || !ebml.every((b, i) => bytes[i] === b)) {
      throw new Error("File content does not match its declared type");
    }
    return;
  }

  // 3. Text and source code formats:
  const textExtensions = [
    "txt",
    "csv",
    "md",
    "json",
    "css",
    "js",
    "ts",
    "jsx",
    "tsx",
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
  ];

  if (textExtensions.includes(ext)) {
    // Check if it starts with any binary media or archive magic bytes
    const isDisguisedBinary =
      (bytes[0] === 0xff && bytes[1] === 0xd8) || // JPEG
      (bytes[0] === 0x89 && bytes[1] === 0x50) || // PNG
      (bytes[0] === 0x47 && bytes[1] === 0x49) || // GIF
      (bytes[0] === 0x25 && bytes[1] === 0x50) || // PDF
      (bytes[0] === 0x50 && bytes[1] === 0x4b) || // ZIP
      (bytes[0] === 0x52 && bytes[1] === 0x61) || // RAR
      (bytes[0] === 0x37 && bytes[1] === 0x7a) || // 7z
      (bytes[0] === 0x1f && bytes[1] === 0x8b); // GZ

    if (isDisguisedBinary) {
      throw new Error("File content does not match its declared type");
    }

    // Check first 512 bytes for null bytes (heuristic for binary content in text file)
    const checkLength = Math.min(bytes.length, 512);
    for (let i = 0; i < checkLength; i++) {
      if (bytes[i] === 0x00) {
        throw new Error("Binary content is not allowed in text/code files");
      }
    }

    // XML-specific security check
    if (ext === "xml") {
      const textPreview = Buffer.from(
        bytes.subarray(0, Math.min(bytes.length, 4096)),
      )
        .toString("utf-8")
        .toLowerCase();
      if (
        textPreview.includes("<script") ||
        textPreview.includes("<html") ||
        textPreview.includes("<svg") ||
        textPreview.includes("<!doctype html")
      ) {
        throw new Error("Scriptable content is not allowed in XML files");
      }
    }
  }

  // 4. Secondary verification with magic-bytes.js for any remaining typed files
  const detected = filetypeinfo(bytes);
  if (detected && detected.length > 0) {
    const isExe = detected.some(
      (d) => d.typename === "exe" || d.typename === "ELF",
    );
    if (isExe) {
      throw new Error("Executable and binary script files are not allowed");
    }
  }
}

export function validateFile(file: File, buffer?: Buffer | Uint8Array) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File exceeds 10MB limit");
  }

  const ext = file.name?.split(".").pop()?.toLowerCase() ?? "";

  // 1. Explicitly block dangerous extensions
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    throw new Error("This file type is not allowed");
  }

  // 2. Explicitly reject SVG and HTML mime types
  if (
    file.type === "image/svg+xml" ||
    file.type === "text/html" ||
    file.type === "application/xhtml+xml"
  ) {
    throw new Error("This file type is not allowed");
  }

  // 3. Extension check: if extension is present, it MUST be allowed
  if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error("File type not allowed");
  }

  // 4. MIME check:
  // Must match either an allowed prefix (image/, video/, audio/ - excluding svg),
  // an allowed exact MIME, or an allowed extension
  const mimePrefixAllowed =
    ALLOWED_MIME_PREFIXES.some((p) => file.type?.startsWith(p)) &&
    file.type !== "image/svg+xml";
  const mimeExactAllowed = ALLOWED_MIME_TYPES.includes(file.type);
  const extAllowed = ALLOWED_EXTENSIONS.includes(ext);

  if (!mimePrefixAllowed && !mimeExactAllowed && !extAllowed) {
    throw new Error("File type not allowed");
  }

  // 5. If buffer content is provided, perform deep content-signature and magic-byte checks
  if (buffer) {
    validateFileContent(ext, file.type, buffer);
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
