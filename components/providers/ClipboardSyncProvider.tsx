"use client";
import { ClipboardSyncStatusProvider } from "./ClipboardSyncStatusProvider";
import { useClipboardSync } from "@/hooks/useClipboardSync";

function ClipboardSyncEngine() {
  useClipboardSync();
  return null;
}

export function ClipboardSyncProvider() {
  return (
    <ClipboardSyncStatusProvider>
      <ClipboardSyncEngine />
    </ClipboardSyncStatusProvider>
  );
}
