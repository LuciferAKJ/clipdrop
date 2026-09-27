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
import { MAX_FILE_SIZE } from "@/lib/validation";
import {
  UploadCloud,
  File as FileIcon,
  X,
  Lock,
  Clock,
  Download,
  Flame,
} from "lucide-react";

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
  { value: "1", label: "1 download" },
  { value: "5", label: "5 downloads" },
  { value: "10", label: "10 downloads" },
  { value: "25", label: "25 downloads" },
  { value: "50", label: "50 downloads" },
  { value: "100", label: "100 downloads" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadZone() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [downloadLimit, setDownloadLimit] = useState<string>("");
  const [expiry, setExpiry] = useState<ExpiryOption>("1h");
  const [oneTimeBurn, setOneTimeBurn] = useState(false);

  const [status, setStatus] = useState<BatchStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [handle, setHandle] = useState<UploadHandle | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const validFiles: File[] = [];

    for (const file of accepted) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds the 10 MB limit`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setFiles((f) => [...f, ...validFiles]);
    }
  }, []);

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

        if (!file) continue;

        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} exceeds the 10 MB limit`);
          continue;
        }

        setFiles((f) => [...f, file]);
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

  function handleOneTimeBurnChange(checked: boolean) {
    setOneTimeBurn(checked);
    if (checked) {
      setDownloadLimit("1");
    } else {
      setDownloadLimit("");
    }
  }

  async function handleUpload() {
    const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE);

    if (oversizedFile) {
      toast.error(`${oversizedFile.name} exceeds the 10 MB limit`);
      return;
    }

    if (!text && files.length === 0) {
      toast.error("Add text or a file first");
      return;
    }

    setStatus("uploading");
    setProgress(0);

    const effectiveLimit = oneTimeBurn
      ? 1
      : downloadLimit
        ? parseInt(downloadLimit, 10)
        : null;

    const uploadHandle = startUpload(
      {
        text: text || undefined,
        files,
        password: password || undefined,
        oneTimeUse: oneTimeBurn,
        downloadLimit: effectiveLimit,
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
    setOneTimeBurn(false);
    setStatus("idle");
    setProgress(0);
  }

  if (result) {
    return <ShareResult code={result} onReset={reset} />;
  }

  const isUploading = status === "uploading";

  return (
    <div
      className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-xs space-y-5"
      onPaste={handlePaste}
    >
      <div>
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          Create a Share
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Drop files or enter text. Generates a temporary 6-character code.
        </p>
      </div>

      {/* Drop Area */}
      <div
        {...getRootProps()}
        role="button"
        tabIndex={0}
        aria-label="Upload files: drag and drop, click to browse, or paste an image"
        className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-border/80 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50"
        } ${isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input {...getInputProps()} />
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary transition-transform group-hover:scale-105">
          <UploadCloud className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-medium text-foreground">
          Drag files here, click to browse, or paste an image
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Up to 10 MB per file · Any format
        </p>
      </div>

      {/* Queued files list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">
            Queued files ({files.length})
          </span>
          <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {files.map((f, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-xs transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileIcon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate font-medium text-foreground">
                    {f.name}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    ({formatBytes(f.size)})
                  </span>
                </div>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors ml-2"
                    aria-label={`Remove ${f.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload Progress */}
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

      {/* Text Snippet Area */}
      <div className="space-y-1.5">
        <label
          htmlFor="share-text"
          className="text-xs font-medium text-muted-foreground"
        >
          Note or code snippet (optional)
        </label>
        <Textarea
          id="share-text"
          placeholder="Or paste/type text..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          disabled={isUploading}
          className="resize-y text-sm font-sans"
        />
      </div>

      {/* Share Configurations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        {/* Expiry Select */}
        <div className="space-y-1.5">
          <label
            htmlFor="expiry-select"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <Clock className="h-3.5 w-3.5" />
            Expires in
          </label>
          <select
            id="expiry-select"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value as ExpiryOption)}
            disabled={isUploading}
            className="h-10 min-h-[40px] w-full rounded-xl border border-border bg-secondary/50 px-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50"
          >
            {EXPIRY_CHOICES.map((choice) => (
              <option
                key={choice.value}
                value={choice.value}
                className="bg-popover text-popover-foreground"
              >
                {choice.label}
              </option>
            ))}
          </select>
        </div>

        {/* Download Limit Select */}
        <div className="space-y-1.5">
          <label
            htmlFor="download-limit-select"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            Download limit
          </label>
          <select
            id="download-limit-select"
            value={downloadLimit}
            onChange={(e) => {
              setDownloadLimit(e.target.value);
              if (e.target.value === "1") {
                setOneTimeBurn(true);
              } else {
                setOneTimeBurn(false);
              }
            }}
            disabled={isUploading}
            className="h-10 min-h-[40px] w-full rounded-xl border border-border bg-secondary/50 px-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50"
          >
            {DOWNLOAD_LIMIT_CHOICES.map((choice) => (
              <option
                key={choice.value}
                value={choice.value}
                className="bg-popover text-popover-foreground"
              >
                {choice.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Password Protection */}
      <div className="space-y-1.5">
        <label
          htmlFor="share-password-input"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
        >
          <Lock className="h-3.5 w-3.5" />
          Password protection
        </label>
        <Input
          id="share-password-input"
          type="password"
          placeholder="Password (optional)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isUploading}
          autoComplete="new-password"
        />
      </div>

      {/* One-time Burn Checkbox */}
      <label className="flex items-center gap-2.5 cursor-pointer pt-1 text-xs select-none">
        <input
          type="checkbox"
          id="delete-after-first-download"
          checked={oneTimeBurn}
          onChange={(e) => handleOneTimeBurnChange(e.target.checked)}
          disabled={isUploading}
          className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
        />
        <span className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <Flame className="h-3.5 w-3.5 text-primary" />
          <span>Delete after first download (one-time view)</span>
        </span>
      </label>

      {/* Submit Button */}
      <Button
        onClick={handleUpload}
        disabled={isUploading}
        size="lg"
        className="w-full h-11 text-sm font-semibold tracking-wide"
      >
        {isUploading ? `Uploading... ${progress}%` : "Create Share"}
      </Button>
    </div>
  );
}
