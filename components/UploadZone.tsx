"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShareResult } from "./ShareResult";
import { UploadProgress } from "./UploadProgress";
import {
  startUpload,
  UploadCancelledError,
  type UploadHandle,
  type ExpiryOption,
} from "@/lib/uploadService";

type BatchStatus = "idle" | "uploading" | "error" | "cancelled";

const EXPIRY_CHOICES: { value: ExpiryOption; label: string }[] = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "12h", label: "12 hours" },
  { value: "1d", label: "1 day" },
  { value: "3d", label: "3 days" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

const DOWNLOAD_LIMIT_CHOICES: { value: string; label: string }[] = [
  { value: "", label: "Unlimited" },
  { value: "1", label: "1" },
  { value: "5", label: "5" },
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

export function UploadZone() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [downloadLimit, setDownloadLimit] = useState<string>("");
  const [expiry, setExpiry] = useState<ExpiryOption>("1h");

  const [status, setStatus] = useState<BatchStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [handle, setHandle] = useState<UploadHandle | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[]) => setFiles((f) => [...f, ...accepted]),
    [],
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: status === "uploading",
  });

  function handlePaste(e: React.ClipboardEvent) {
    if (status === "uploading") return;
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) setFiles((f) => [...f, file]);
      }
    }
  }

  function removeFile(idx: number) {
    if (status === "uploading") return;
    setFiles((f) => f.filter((_, i) => i !== idx));
  }

  function cancelUpload() {
    handle?.cancel();
  }

  async function handleUpload() {
    if (!text && files.length === 0) {
      toast.error("Add text or a file first");
      return;
    }

    setStatus("uploading");
    setProgress(0);

    const uploadHandle = startUpload(
      {
        text: text || undefined,
        files,
        password: password || undefined,
        downloadLimit: downloadLimit ? parseInt(downloadLimit, 10) : null,
        expiry,
      },
      (percent) => setProgress(percent),
    );
    setHandle(uploadHandle);

    try {
      const data = await uploadHandle.promise;
      setResult(data.code);
      setStatus("idle");
      toast.success(`Uploaded! Code: ${data.code}`);
    } catch (err) {
      if (err instanceof UploadCancelledError) {
        setStatus("cancelled");
        toast.info("Upload cancelled");
      } else {
        setStatus("error");
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    } finally {
      setHandle(null);
    }
  }

  function reset() {
    setResult(null);
    setText("");
    setFiles([]);
    setPassword("");
    setDownloadLimit("");
    setExpiry("1h");
    setStatus("idle");
    setProgress(0);
  }

  if (result) {
    return <ShareResult code={result} onReset={reset} />;
  }

  const isUploading = status === "uploading";

  return (
    <div className="space-y-4" onPaste={handlePaste}>
      <div
        {...getRootProps()}
        role="button"
        tabIndex={0}
        aria-label="Upload files: drag and drop, click to browse, or paste an image"
        className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors
    ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30"}
    ${isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input {...getInputProps()} />
        <p className="text-muted-foreground">
          Drag files here, click to browse, or paste an image
        </p>
      </div>

      {files.length > 0 && (
        <ul className="text-sm space-y-1">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex justify-between items-center rounded-md bg-muted px-3 py-1.5"
            >
              <span className="truncate">{f.name}</span>
              {!isUploading && (
                <button
                  onClick={() => removeFile(i)}
                  className="text-muted-foreground hover:text-destructive ml-2"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {status === "uploading" && (
        <UploadProgress
          percent={progress}
          status="uploading"
          onCancel={cancelUpload}
        />
      )}
      {status === "cancelled" && (
        <UploadProgress percent={0} status="cancelled" />
      )}

      <Textarea
        placeholder="Or paste/type text..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        disabled={isUploading}
      />

      <div className="grid grid-cols-1 gap-3">
        <Input
          type="password"
          placeholder="Password (optional)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isUploading}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label
            htmlFor="download-limit-select"
            className="text-sm text-muted-foreground"
          >
            Download limit
          </label>
          <select
            id="download-limit-select"
            value={downloadLimit}
            onChange={(e) => setDownloadLimit(e.target.value)}
            disabled={isUploading}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            {DOWNLOAD_LIMIT_CHOICES.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="expiry-select"
            className="text-sm text-muted-foreground"
          >
            Expires in
          </label>
          <select
            id="expiry-select"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value as ExpiryOption)}
            disabled={isUploading}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            {EXPIRY_CHOICES.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button onClick={handleUpload} disabled={isUploading} className="w-full">
        {isUploading ? `Uploading... ${progress}%` : "Create Share"}
      </Button>
    </div>
  );
}
