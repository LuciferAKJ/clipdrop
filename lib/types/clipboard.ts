export type ClipboardContentType = "TEXT" | "SHARE";

export interface ClipboardPayload {
  contentType: ClipboardContentType;
  textContent?: string | null;
  shareId?: string | null;
}

export interface ClipboardState {
  contentType: ClipboardContentType;
  textContent: string | null;
  shareId: string | null;
  updatedAt: string;
}
