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
  FileText,
  FileCode2,
  FileArchive,
  FileImage,
  Film,
  Music,
  X,
  Lock,
  Clock,
  Download,
  Flame,
  Layers,
  Sparkles,
} from "lucide-react";

type BatchStatus = "idle" | "uploading" | "error" | "cancelled";

const EXPIRY_CHOICES: { value: ExpiryOption; label: string }[] = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "12h", label: "12 hours" },
  { value: "1d", label: "24 hours (1 day)" },
  { value: "3d", label: "3 days" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

const DOWNLOAD_LIMIT_CHOICES: { value: string; label: string }[] = [
  { value: "", label: "Unlimited downloads" },
  { value: "1", label: "1 download (burn)" },
  { value: "5", label: "5 downloads" },
  { value: "10", label: "10 downloads" },
  { value: "25", label: "25 downloads" },
  { value: "50", label: "50 downloads" },
  { value: "100", label: "100 downloads" },
];

function getFileIcon(mime: string, name: string) {
  if (mime.startsWith("image/")) return FileImage;
  if (mime.startsWith("video/")) return Film;
  if (mime.startsWith("audio/")) return Music;
  if (
    mime.includes("zip") ||
    mime.includes("rar") ||
    mime.includes("7z") ||
    mime.includes("tar") ||
    mime.includes("gzip") ||
    name.endsWith(".zip") ||
    name.endsWith(".tar.gz")
  ) {
    return FileArchive;
  }
  if (
    mime.includes("javascript") ||
    mime.includes("typescript") ||
    mime.includes("json") ||
    mime.includes("html") ||
    mime.includes("css") ||
    name.endsWith(".ts") ||
    name.endsWith(".tsx") ||
    name.endsWith(".js") ||
    name.endsWith(".py") ||
    name.endsWith(".json")
  ) {
    return FileCode2;
  }
  if (mime.includes("pdf") || mime.includes("word") || mime.includes("text"))
    return FileText;
  return FileIcon;
}

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
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div
      className="rounded-2xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs space-y-6"
      onPaste={handlePaste}
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div>
          <h2 className="font-heading text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Create a Share</span>
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Drop files or compose text. Generates a temporary 6-character
            transit code.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground bg-secondary/60 px-2.5 py-1 rounded-md border border-border/40">
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span>Max 10 MB / file</span>
        </div>
      </div>

      {/* Drop Area */}
      <div
        {...getRootProps()}
        role="button"
        tabIndex={0}
        aria-label="Upload files: drag and drop, click to browse, or paste an image"
        className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-7 sm:p-9 text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
          isDragActive
            ? "border-primary bg-primary/10 shadow-lg shadow-primary/5"
            : "border-border/80 bg-secondary/20 hover:border-primary/50 hover:bg-secondary/40"
        } ${isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input {...getInputProps()} />
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary border border-border/60 transition-transform group-hover:scale-105 shadow-xs">
          <UploadCloud className="h-6 w-6 stroke-[1.75]" />
        </div>
        <p className="mt-3.5 text-sm font-semibold text-foreground">
          Drag &amp; drop files, click to browse, or paste image
        </p>
        <p className="mt-1 text-xs text-muted-foreground font-mono">
          Documents, Archives, Images, Code · Up to 10 MB each
        </p>
      </div>

      {/* Queued files list */}
      {files.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Queued Files ({files.length})
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              Total: {formatBytes(totalBytes)}
            </span>
          </div>

          <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {files.map((f, i) => {
              const Icon = getFileIcon(f.type, f.name);

              return (
                <li
                  key={i}
                  className="group flex items-center justify-between rounded-xl border border-border/70 bg-secondary/40 px-3.5 py-2.5 text-xs transition-colors hover:border-border/90"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary border border-border/40">
                      <Icon className="h-4 w-4" />
                    </div>
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
                      className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors ml-2"
                      aria-label={`Remove ${f.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
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
      {status === "error" && (
        <UploadProgress percent={progress} status="error" />
      )}

      {/* Text Snippet Area */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="share-text"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Text / Code note (optional)
          </label>
          <span className="text-[11px] text-muted-foreground font-mono">
            {text.length > 0 ? `${text.length} chars` : "Plaintext or Markdown"}
          </span>
        </div>
        <Textarea
          id="share-text"
          placeholder="Paste or type notes, code snippets, tokens, or links..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          disabled={isUploading}
          className="resize-y text-xs sm:text-sm font-mono leading-relaxed"
        />
      </div>

      {/* Share Configurations */}
      <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 space-y-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Security &amp; Expiration Controls</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Expiry Select */}
          <div className="space-y-1.5">
            <label
              htmlFor="expiry-select"
              className="flex items-center gap-1.5 text-xs font-medium text-foreground"
            >
              <Clock className="h-3.5 w-3.5 text-primary" />
              Expires after
            </label>
            <select
              id="expiry-select"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value as ExpiryOption)}
              disabled={isUploading}
              className="h-10 min-h-[44px] w-full rounded-xl border border-border bg-card px-3 text-xs sm:text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50"
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
              className="flex items-center gap-1.5 text-xs font-medium text-foreground"
            >
              <Download className="h-3.5 w-3.5 text-primary" />
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
              className="h-10 min-h-[44px] w-full rounded-xl border border-border bg-card px-3 text-xs sm:text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50"
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
        <div className="space-y-1.5 pt-1">
          <label
            htmlFor="share-password-input"
            className="flex items-center gap-1.5 text-xs font-medium text-foreground"
          >
            <Lock className="h-3.5 w-3.5 text-primary" />
            Password protection (optional)
          </label>
          <Input
            id="share-password-input"
            type="password"
            placeholder="Set password for recipient access..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isUploading}
            autoComplete="new-password"
            className="h-10 min-h-[44px] text-xs sm:text-sm"
          />
        </div>

        {/* One-time Burn Checkbox */}
        <label className="flex items-start sm:items-center gap-2.5 cursor-pointer pt-1 text-xs select-none min-h-[44px]">
          <input
            type="checkbox"
            id="delete-after-first-download"
            checked={oneTimeBurn}
            onChange={(e) => handleOneTimeBurnChange(e.target.checked)}
            disabled={isUploading}
            className="mt-0.5 sm:mt-0 h-4 w-4 rounded border-border accent-primary cursor-pointer shrink-0"
          />
          <span className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors leading-tight">
            <Flame className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>
              Delete immediately after first download or reveal (one-time view)
            </span>
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleUpload}
        disabled={isUploading}
        size="lg"
        className="w-full h-12 text-sm font-semibold tracking-wide shadow-md shadow-primary/10"
      >
        {isUploading
          ? `Uploading & Encrypting... ${progress}%`
          : "Create Ephemeral Share"}
      </Button>
    </div>
  );
}
