"use client";

export function UploadProgress({
  percent,
  status,
  onCancel,
}: {
  percent: number;
  status: "uploading" | "done" | "error" | "cancelled";
  onCancel?: () => void;
}) {
  const label =
    status === "done"
      ? "Upload Complete"
      : status === "error"
        ? "Upload Failed"
        : status === "cancelled"
          ? "Upload Cancelled"
          : `Uploading (${percent}%)`;

  return (
    <div
      className="space-y-2 rounded-xl border border-border/80 bg-secondary/40 p-3"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between text-xs font-medium">
        <span
          className={
            status === "error" ? "text-destructive" : "text-foreground"
          }
        >
          {label}
        </span>
        {status === "uploading" && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full transition-all duration-200 rounded-full ${
            status === "error" || status === "cancelled"
              ? "bg-destructive"
              : "bg-primary"
          }`}
          style={{
            width: `${status === "done" ? 100 : Math.max(percent, 4)}%`,
          }}
        />
      </div>
    </div>
  );
}
