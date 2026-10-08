"use client";

import { Loader2, XCircle, CheckCircle2, AlertCircle } from "lucide-react";

export function UploadProgress({
  percent,
  status,
  onCancel,
}: {
  percent: number;
  status: "uploading" | "done" | "error" | "cancelled";
  onCancel?: () => void;
}) {
  const isDone = status === "done";
  const isError = status === "error";
  const isCancelled = status === "cancelled";
  const isUploading = status === "uploading";

  return (
    <div
      className="space-y-2.5 rounded-xl border border-border/80 bg-secondary/40 p-3.5 backdrop-blur-xs shadow-xs"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-medium">
          {isUploading && (
            <>
              <Loader2
                className="h-3.5 w-3.5 animate-spin text-primary"
                aria-hidden="true"
              />
              <span className="text-foreground">
                Encrypting &amp; transferring...{" "}
                <span className="font-mono font-bold text-primary">
                  {percent}%
                </span>
              </span>
            </>
          )}
          {isDone && (
            <>
              <CheckCircle2
                className="h-3.5 w-3.5 text-emerald-400"
                aria-hidden="true"
              />
              <span className="font-semibold text-emerald-400">
                Upload Complete
              </span>
            </>
          )}
          {isError && (
            <>
              <AlertCircle
                className="h-3.5 w-3.5 text-destructive"
                aria-hidden="true"
              />
              <span className="font-semibold text-destructive">
                Upload Failed
              </span>
            </>
          )}
          {isCancelled && (
            <>
              <XCircle
                className="h-3.5 w-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">Upload Cancelled</span>
            </>
          )}
        </div>

        {isUploading && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-md px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors min-h-[32px]"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-out rounded-full ${
            isError || isCancelled
              ? "bg-destructive"
              : isDone
                ? "bg-emerald-400"
                : "bg-gradient-to-r from-primary to-indigo-400"
          }`}
          style={{
            width: `${isDone ? 100 : Math.max(percent, 4)}%`,
          }}
        />
      </div>
    </div>
  );
}
