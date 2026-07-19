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
    status === "done" ? "Complete" :
    status === "error" ? "Failed" :
    status === "cancelled" ? "Cancelled" :
    `${percent}%`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {status === "uploading" && onCancel && (
          <button onClick={onCancel} className="hover:text-destructive transition-colors">
            Cancel
          </button>
        )}
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full transition-all duration-200 ${
            status === "error" || status === "cancelled" ? "bg-destructive" : "bg-primary"
          }`}
          style={{ width: `${status === "done" ? 100 : percent}%` }}
        />
      </div>
    </div>
  );
}