"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDownToLine,
  Check,
  Clock,
  Copy,
  Eye,
  File,
  FileArchive,
  FileCode2,
  FileImage,
  FileText,
  Film,
  Loader2,
  LockKeyhole,
  Music,
  Share2,
  ArrowLeft,
  RefreshCw,
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
  oneTimeUse?: boolean;
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
  const router = useRouter();

  const [needsPassword, setNeedsPassword] = useState(false);
  const [isOneTime, setIsOneTime] = useState(false);
  const [password, setPassword] = useState("");
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [revealing, setRevealing] = useState(false);
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

        setIsOneTime(!!meta.oneTimeUse);

        if (meta.requiresPassword) {
          setNeedsPassword(true);
          setLoading(false);
        } else if (meta.oneTimeUse) {
          // One-time share without password: do NOT consume automatically during page load.
          // Wait for explicit user reveal to protect against automated link crawlers / prefetchers.
          setLoading(false);
        } else {
          // Normal share: preserve automatic loading
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

  async function handleReveal() {
    if (revealing || checking) return;
    setRevealing(true);
    try {
      await fetchContent();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reveal share");
    } finally {
      setRevealing(false);
    }
  }

  async function handleUnlock() {
    if (checking || revealing || !password) return;
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
        <div className="space-y-5">
          <div className="text-center space-y-2.5">
            <Skeleton className="mx-auto h-7 w-36 rounded-full" />
            <Skeleton className="mx-auto h-9 w-60 rounded-xl" />
            <Skeleton className="mx-auto h-4 w-44 rounded-lg" />
          </div>
          <div className="pt-4 space-y-3">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4 py-12">
        <div className="w-full rounded-2xl border border-border/80 bg-card p-6 sm:p-8 text-center shadow-xs space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive border border-destructive/25 shadow-xs">
            <AlertCircle className="h-7 w-7" />
          </div>

          <div className="space-y-1.5">
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
              Share not found
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {error ||
                "This share is no longer available, has expired, or reached its maximum download limit."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
            <Button
              variant="outline"
              size="lg"
              className="h-11 text-xs w-full sm:w-auto font-medium"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              <span>Try Again</span>
            </Button>
            <Button
              size="lg"
              className="h-11 text-xs w-full sm:w-auto font-semibold shadow-sm shadow-primary/20"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (needsPassword) {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-md items-center justify-center px-4 py-12">
        <div className="w-full rounded-2xl border border-border/80 bg-card p-6 sm:p-8 text-center shadow-xs space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary border border-border/60 shadow-xs">
            <LockKeyhole className="h-7 w-7 stroke-[1.75]" aria-hidden="true" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
              <span>{code.toUpperCase()}</span>
            </div>
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
              Password Required
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isOneTime
                ? "This is a password-protected one-time share. Entering the correct password will reveal and consume the content."
                : "This share is protected with encryption. Enter the password set by the sender to access the content."}
            </p>
          </div>

          <div className="space-y-3 text-left">
            <label
              htmlFor="share-password"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Recipient Password
            </label>

            <Input
              id="share-password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              autoComplete="current-password"
              className="h-12 text-sm"
              autoFocus
            />

            <Button
              id="unlock-share-btn"
              onClick={handleUnlock}
              disabled={checking || revealing || !password}
              aria-busy={checking}
              size="lg"
              className="h-12 w-full text-sm font-semibold tracking-wide shadow-md shadow-primary/10"
            >
              {checking ? (
                <>
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Verifying Password...</span>
                </>
              ) : isOneTime ? (
                "Unlock & Reveal Share"
              ) : (
                "Unlock Share"
              )}
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
            Protected with zero-knowledge bcrypt password authentication.
          </p>
        </div>
      </main>
    );
  }

  if (isOneTime && !data) {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-md items-center justify-center px-4 py-12">
        <div className="w-full rounded-2xl border border-border/80 bg-card p-6 sm:p-8 text-center shadow-xs space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs">
            <Eye className="h-7 w-7 stroke-[1.75]" aria-hidden="true" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              <span>SINGLE VIEW PROTOCOL</span>
            </div>
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
              One-Time Share
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This content can only be revealed once. Once viewed or downloaded,
              it is permanently consumed and cannot be accessed again.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              id="reveal-share-btn"
              onClick={handleReveal}
              disabled={revealing || checking}
              aria-busy={revealing}
              size="lg"
              className="h-12 w-full text-sm font-semibold tracking-wide shadow-md shadow-primary/10"
            >
              {revealing ? (
                <>
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Revealing &amp; Consuming…</span>
                </>
              ) : (
                "Reveal Share"
              )}
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
            Automated crawlers and prefetchers are blocked from burning this
            share.
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
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/50 px-3.5 py-1 text-xs backdrop-blur-xs">
          <span className="font-mono font-bold tracking-widest text-foreground">
            {code.toUpperCase()}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            aria-label="Copy share code"
            className="inline-flex items-center justify-center p-1.5 -m-1 rounded-md text-muted-foreground hover:text-foreground transition-colors ml-1 min-h-[32px] min-w-[32px]"
          >
            {copiedCode ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
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
                  aria-label={`Download ${f.originalName} (opens in new tab)`}
                  className="group flex items-center justify-between gap-3.5 rounded-2xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-xs transition-all hover:border-primary/50 hover:bg-secondary/30 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary border border-border/60 transition-transform group-hover:scale-105 shadow-xs">
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

                  <div className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/60 px-3.5 text-xs font-semibold text-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary shadow-xs">
                    <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Download</span>
                    <span className="sr-only">(opens in new tab)</span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!hasText && !hasFiles && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center space-y-4">
          <File className="mx-auto h-8 w-8 text-muted-foreground" />
          <div className="space-y-1">
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Nothing was shared
            </h2>
            <p className="text-xs text-muted-foreground">
              This link does not contain any files or text.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs shadow-primary/20 transition-all hover:bg-primary/90"
          >
            Return Home
          </Link>
        </div>
      )}

      {/* Expiry Footnote */}
      {(hasFiles || hasText) && (
        <div className="flex items-center justify-center gap-1.5 pt-4 text-center text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span>
            Shared content expires automatically according to sender
            configuration
          </span>
        </div>
      )}

      {/* Send files back CTA */}
      <div className="pt-2 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-secondary/40 min-h-[44px]"
        >
          <span>Need to send files back? Create an ephemeral share</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </main>
  );
}
