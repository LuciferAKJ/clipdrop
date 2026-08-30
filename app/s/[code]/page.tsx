"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowDownToLine,
  Check,
  Clock3,
  File,
  FileArchive,
  FileCode2,
  FileImage,
  FileText,
  Film,
  LockKeyhole,
  Music,
  Package,
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
  if (mime.includes("presentation")) return "PowerPoint Presentation";

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
          throw new Error(json.error || "Failed to retrieve");
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
          throw new Error(meta.error || "Not found");
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
          setError(e instanceof Error ? e.message : "Failed to load");
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
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
        <div className="space-y-5">
          <Skeleton className="mx-auto h-8 w-40" />
          <Skeleton className="mx-auto h-5 w-64" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-6 py-12">
        <div className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>

          <h1 className="mt-5 text-xl font-semibold">Unable to open share</h1>

          <p className="mt-2 text-sm text-muted-foreground">{error}</p>

          <Button
            variant="outline"
            className="mt-6"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </main>
    );
  }

  if (needsPassword) {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-md items-center justify-center px-6 py-12">
        <div className="w-full rounded-2xl border bg-card p-7 text-center shadow-sm sm:p-9">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <LockKeyhole className="h-6 w-6 text-primary" />
          </div>

          <div className="mt-5 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Password protected
            </h1>

            <p className="text-sm leading-6 text-muted-foreground">
              This share is protected. Enter the password to access the shared
              content.
            </p>
          </div>

          <div className="mt-6 space-y-3 text-left">
            <label htmlFor="share-password" className="text-sm font-medium">
              Password
            </label>

            <Input
              id="share-password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              autoComplete="off"
              className="h-11"
            />

            <Button
              onClick={handleUnlock}
              disabled={checking || !password}
              className="h-11 w-full"
            >
              {checking ? "Checking..." : "Unlock Share"}
            </Button>
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            Only someone with the correct password can access this share.
          </p>
        </div>
      </main>
    );
  }

  const files = data?.files ?? [];
  const hasText = !!data?.textContent;
  const hasFiles = files.length > 0;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 sm:py-14">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Package className="h-6 w-6 text-primary" />
        </div>

        <p className="mt-5 text-sm font-medium text-primary">ClipDrop Share</p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          Shared content
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Someone shared files or text with you.
        </p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5">
          <span className="font-mono text-xs font-semibold tracking-widest">
            {code.toUpperCase()}
          </span>
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        </div>
      </div>

      {/* Shared text */}
      {hasText && (
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Shared text</h2>
          </div>

          <LazyTextViewer text={data.textContent!} />
        </section>
      )}

      {/* Files */}
      {hasFiles && (
        <section className={hasText ? "mt-8" : "mt-8"}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <File className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Shared files</h2>
            </div>

            <span className="text-xs text-muted-foreground">
              {files.length} file{files.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-3">
            {files.map((f) => {
              const Icon = getFileIcon(f.mimeType);

              return (
                <a
                  key={f.id}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{f.originalName}</p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {getFileTypeLabel(f.mimeType)}
                      {" · "}
                      {formatSize(f.sizeBytes)}
                    </p>
                  </div>

                  <div className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors group-hover:bg-accent">
                    <ArrowDownToLine className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!hasText && !hasFiles && (
        <div className="mt-10 rounded-2xl border border-dashed bg-card/50 p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <File className="h-5 w-5 text-muted-foreground" />
          </div>

          <h2 className="mt-4 font-semibold">Nothing was shared</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            This link doesn&apos;t contain any files or text.
          </p>
        </div>
      )}

      {/* Footer hint */}
      {(hasFiles || hasText) && (
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" />
          Shared content expires automatically.
        </div>
      )}
    </main>
  );
}
