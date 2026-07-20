/**
 * Centralized constants — consolidates literals that were previously
 * scattered across route handlers, validation functions, and hooks.
 */

// Share expiration
export const DEFAULT_SHARE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Text limits
export const MAX_TEXT_LENGTH = 50_000;
export const MAX_CLIPBOARD_TEXT_LENGTH = 50_000;

// File limits
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_PREFIXES = [
  "image/",
  "video/",
  "audio/",
  "application/pdf",
  "application/zip",
] as const;

// Device
export const MAX_DEVICE_NAME_LENGTH = 100;
export const MAX_CLIENT_ID_LENGTH = 100;

// Clipboard sync (client-side polling)
export const CLIPBOARD_POLL_INTERVAL_MS = 3000;

// Rate limiting
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_UPLOAD_MAX = 10;
export const RATE_LIMIT_CLIPBOARD_MAX = 30; // clipboard pushes are more frequent by design
export const RATE_LIMIT_DEVICE_MAX = 20;
