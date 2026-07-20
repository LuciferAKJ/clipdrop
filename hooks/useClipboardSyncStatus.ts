"use client";
import { useClipboardSyncStatusContext } from "@/components/providers/ClipboardSyncStatusProvider";
import type { SyncStatus } from "@/components/providers/ClipboardSyncStatusProvider";

export interface ClipboardSyncStatus {
  status: SyncStatus;
  lastSyncedAt: string | null;
}

/** Read-only view of clipboard sync status. No setters exposed. */
export function useClipboardSyncStatus(): ClipboardSyncStatus {
  return useClipboardSyncStatusContext();
}
