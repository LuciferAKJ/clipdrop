export interface UploadPayload {
  text?: string;
  files?: File[];
  password?: string;
  oneTimeUse?: boolean;
}

export interface UploadResult {
  code: string;
}

export interface UploadHandle {
  promise: Promise<UploadResult>;
  cancel: () => void;
}

export class UploadCancelledError extends Error {
  constructor() {
    super("Upload cancelled");
    this.name = "UploadCancelledError";
  }
}

/**
 * Encapsulates the upload transport (currently XMLHttpRequest against
 * /api/upload). UploadZone never touches XHR, FormData construction,
 * or response parsing directly — it only calls startUpload() and
 * reacts to the returned handle + progress callback.
 *
 * Swapping providers, adding resumable/chunked uploads, or moving
 * uploads to a background worker later should only require changes
 * inside this file.
 */
function buildFormData(payload: UploadPayload): FormData {
  const formData = new FormData();

  if (payload.text) formData.append("text", payload.text);
  payload.files?.forEach((file) => formData.append("files", file));

  if (payload.password) formData.append("password", payload.password);
  if (payload.oneTimeUse) formData.append("oneTimeUse", "true");

  return formData;
}

function parseResponse(xhr: XMLHttpRequest): UploadResult {
  let data: unknown;

  try {
    data = JSON.parse(xhr.responseText);
  } catch {
    throw new Error("Invalid server response");
  }

  if (xhr.status < 200 || xhr.status >= 300) {
    const message =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error?: unknown }).error)
        : "Upload failed";

    throw new Error(message);
  }

  return data as UploadResult;
}

export function startUpload(
  payload: UploadPayload,
  onProgress?: (percent: number) => void,
): UploadHandle {
  const xhr = new XMLHttpRequest();

  const promise = new Promise<UploadResult>((resolve, reject) => {
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        resolve(parseResponse(xhr));
      } catch (err) {
        reject(err);
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new UploadCancelledError());

    xhr.send(buildFormData(payload));
  });

  return {
    promise,
    cancel: () => xhr.abort(),
  };
}
