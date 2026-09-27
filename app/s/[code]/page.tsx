"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowDownToLine,
  Check,
  Clock,
  Copy,
  File,
  FileArchive,
  FileCode2,
  FileImage,
  FileText,
  Film,
  LockKeyhole,
  Music,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { LazyTextViewer } from "@/components/share/LazyTextViewer";

interface FileMeta {
  id: string;
  url: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
}

interface ShareData {
  textContent?: string | null;
  files?: FileMeta[];
}

interface ShareApiError {
  error?: string;
}

interface ShareMeta extends ShareApiError {
  requiresPassword?: boolean;
}

function getFileIcon(mime: string) {
  if (mime.startsWith("image/")) return FileImage;
  if (mime.startsWith("video/")) return Film;
  if (mime.startsWith("audio/")) return Music;

  if (
    mime.includes("zip") ||
    mime.includes("rar") ||
    mime.includes("7z") ||
    mime.includes("tar") ||
    mime.includes("gzip")
  ) {
    return FileArchive;
  }

  if (
    mime.includes("javascript") ||
    mime.includes("typescript") ||
    mime.includes("json") ||
    mime.includes("html") ||
    mime.includes("css") ||
    mime.includes("python") ||
    mime.includes("java") ||
    mime.includes("c++") ||
    mime.includes("csharp") ||
    mime.includes("rust") ||
    mime.includes("php") ||
    mime.includes("swift") ||
    mime.includes("kotlin") ||
    mime.includes("sql")
  ) {
    return FileCode2;
  }

  if (mime.includes("pdf") || mime.includes("word")) return FileText;

  return File;
}

function getFileTypeLabel(mime: string) {
  if (mime.includes("pdf")) return "PDF Document";
  if (mime.includes("word")) return "Word Document";
  if (mime.includes("spreadsheet")) return "Excel Spreadsheet";
  if (mime.includes("presentation")) return "Presentation";

  if (
    mime.includes("zip") ||
    mime.includes("rar") ||
    mime.includes("7z") ||
    mime.includes("tar") ||
    mime.includes("gzip")
  ) {
    return "Archive";
  }

  if (mime.startsWith("image/")) return "Image";
  if (mime.startsWith("video/")) return "Video";
  if (mime.startsWith("audio/")) return "Audio";

  if (mime.includes("javascript")) return "JavaScript";
  if (mime.includes("typescript")) return "TypeScript";
  if (mime.includes("json")) return "JSON";
  if (mime.includes("html")) return "HTML";
  if (mime.includes("css")) return "CSS";
  if (mime.includes("python")) return "Python";
  if (mime.includes("java")) return "Java";
  if (mime.includes("c++")) return "C++";
  if (mime.includes("csharp")) return "C#";
  if (mime.includes("rust")) return "Rust";
  if (mime.includes("php")) return "PHP";
  if (mime.includes("swift")) return "Swift";
  if (mime.includes("kotlin")) return "Kotlin";
  if (mime.includes("sql")) return "SQL";

  return "File";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ReceivePage() {
  const { code } = useParams<{ code: string }>();

  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchContent = useCallback(
    async (pw?: string) => {
      setChecking(true);

      try {
        const res = await fetch(`/api/share/${code}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: pw || undefined,
          }),
        });

        const json: ShareData & ShareApiError = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to retrieve share");
        }

        setData(json);
        setNeedsPassword(false);
      } finally {
        setChecking(false);
        setLoading(false);
      }
    },
    [code],
  );

  useEffect(() => {
    let cancelled = false;

    async function checkMeta() {
      try {
        const res = await fetch(`/api/share/${code}`);
        const meta: ShareMeta = await res.json();

        if (!res.ok) {
          throw new Error(meta.error || "Share not found or expired");
        }

        if (cancelled) return;

        if (meta.requiresPassword) {
          setNeedsPassword(true);
          setLoading(false);
        } else {
          await fetchContent();
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Share not found or expired",
          );
          setLoading(false);
        }
      }
    }

    checkMeta();

    return () => {
      cancelled = true;
    };
  }, [code, fetchContent]);

  async function handleUnlock() {
    try {
      await fetchContent(password);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invalid password");
    }
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(code.toUpperCase());
    toast.success("Share code copied");
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="space-y-4">
          <Skeleton className="mx-auto h-8 w-44 rounded-xl" />
          <Skeleton className="mx-auto h-4 w-64 rounded-lg" />
          <div className="pt-4 space-y-3">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4 py-12">
        <div className="w-full rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>

          <h1 className="mt-4 font-heading text-lg font-semibold text-foreground">
            Share not found
          </h1>

          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            {error ||
              "This share is no longer available or has reached its download limit."}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Button
              variant="outline"
              size="lg"
              className="h-10 text-xs w-full sm:w-auto"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
            <Button
              size="lg"
              className="h-10 text-xs w-full sm:w-auto"
              onClick={() => (window.location.href = "/")}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (needsPassword) {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-md items-center justify-center px-4 py-12">
        <div className="w-full rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
            <LockKeyhole className="h-6 w-6" />
          </div>

          <div className="mt-4 space-y-1">
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
              Password Required
            </h1>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This share is protected. Enter the password to access the content.
            </p>
          </div>

          <div className="mt-6 space-y-3 text-left">
            <label
              htmlFor="share-password"
              className="text-xs font-medium text-muted-foreground"
            >
              Password
            </label>

            <Input
              id="share-password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              autoComplete="current-password"
              className="h-11"
            />

            <Button
              onClick={handleUnlock}
              disabled={checking || !password}
              size="lg"
              className="h-11 w-full text-sm font-semibold tracking-wide"
            >
              {checking ? "Checking..." : "Unlock Share"}
            </Button>
          </div>

          <p className="mt-5 text-[11px] text-muted-foreground">
            Password was set by the sender at upload time.
          </p>
        </div>
      </main>
    );
  }

  const files = data?.files ?? [];
  const hasText = !!data?.textContent;
  const hasFiles = files.length > 0;

  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-14 space-y-8">
      {/* Header Info */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3.5 py-1 text-xs">
          <span className="font-mono font-bold tracking-wider text-foreground">
            {code.toUpperCase()}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="text-muted-foreground hover:text-foreground transition-colors ml-1"
            title="Copy share code"
          >
            {copiedCode ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Shared Content
        </h1>

        <p className="text-xs text-muted-foreground">
          {hasFiles && hasText
            ? `${files.length} file${files.length !== 1 ? "s" : ""} and 1 text note`
            : hasFiles
              ? `${files.length} shared file${files.length !== 1 ? "s" : ""}`
              : "Shared note / snippet"}
        </p>
      </div>

      {/* Shared Text Snippet */}
      {hasText && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Shared text
            </h2>
          </div>

          <LazyTextViewer text={data.textContent!} />
        </section>
      )}

      {/* Shared Files List */}
      {hasFiles && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Shared files
              </h2>
            </div>

            <span className="text-xs font-mono text-muted-foreground">
              {files.length} file{files.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-2.5">
            {files.map((f) => {
              const Icon = getFileIcon(f.mimeType);

              return (
                <a
                  key={f.id}
                  href={f.url}
                  download={f.originalName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3.5 rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-xs transition-all hover:border-primary/40 hover:bg-secondary/40 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary transition-transform group-hover:scale-105">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {f.originalName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                        {getFileTypeLabel(f.mimeType)} ·{" "}
                        {formatSize(f.sizeBytes)}
                      </p>
                    </div>
                  </div>

                  <div className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/50 px-3 text-xs font-semibold text-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                    <ArrowDownToLine className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!hasText && !hasFiles && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center space-y-2">
          <File className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="font-heading text-sm font-semibold text-foreground">
            Nothing was shared
          </h2>
          <p className="text-xs text-muted-foreground">
            This link does not contain any files or text.
          </p>
        </div>
      )}

      {/* Expiry Footnote */}
      {(hasFiles || hasText) && (
        <div className="flex items-center justify-center gap-1.5 pt-4 text-center text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Shared content expires automatically</span>
        </div>
      )}
    </main>
  );
}
