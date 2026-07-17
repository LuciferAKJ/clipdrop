export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_MIME_PREFIXES = [
  "image/",
  "video/",
  "audio/",
  "application/pdf",
  "application/zip",
  "application/octet-stream"
];


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


  const allowed = ALLOWED_MIME_PREFIXES.some(
    (prefix) => file.type.startsWith(prefix)
  );


  if (!allowed) {
    throw new Error("File type not allowed");
  }
}