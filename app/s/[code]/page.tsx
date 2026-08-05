"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
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
  if (mime.startsWith("image/")) return "🖼️";
  if (mime.startsWith("video/")) return "🎥";
  if (mime.startsWith("audio/")) return "🎵";
  if (mime.includes("pdf")) return "📄";
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("7z"))
    return "📦";
  if (
    mime.includes("javascript") ||
    mime.includes("typescript") ||
    mime.includes("json") ||
    mime.includes("html") ||
    mime.includes("css")
  )
    return "💻";

  return "📁";
}

function getFileTypeLabel(mime: string) {
  if (mime.includes("pdf")) return "PDF Document";
  if (mime.includes("word")) return "Word Document";
  if (mime.includes("spreadsheet")) return "Excel Spreadsheet";
  if (mime.includes("presentation")) return "PowerPoint Presentation";
  if (mime.includes("zip")) return "ZIP Archive";
  if (mime.startsWith("image/")) return "Image";
  if (mime.startsWith("video/")) return "Video";
  if (mime.startsWith("audio/")) return "Audio";
  if (mime.includes("javascript")) return "JavaScript File";
  if (mime.includes("typescript")) return "TypeScript File";
  if (mime.includes("json")) return "JSON File";
  if (mime.includes("html")) return "HTML File";
  if (mime.includes("css")) return "CSS File";
  return "File";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
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
      <main className="max-w-xl mx-auto p-8 space-y-3">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-xl mx-auto p-8 text-center space-y-3">
        <div className="text-4xl">⚠️</div>
        <p className="text-destructive font-medium">{error}</p>
      </main>
    );
  }

  if (needsPassword) {
    return (
      <main className="max-w-sm mx-auto p-8 space-y-4 text-center">
        <div className="text-4xl">🔒</div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Password Protected</h1>
          <p className="text-sm text-muted-foreground">
            This share is protected.
          </p>
        </div>

        <Input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
        />

        <Button onClick={handleUnlock} disabled={checking} className="w-full">
          {checking ? "Checking..." : "Unlock"}
        </Button>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Shared Files</h1>
        <p className="text-muted-foreground">
          Download or view the shared content below.
        </p>
      </div>

      {data?.textContent && <LazyTextViewer text={data.textContent} />}

      {data?.files && data.files.length > 0 && (
        <ul className="space-y-3">
          {data.files.map((f) => (
            <li key={f.id}>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between items-center rounded-xl border p-4 hover:bg-accent hover:text-accent-foreground transition-colors group"
              >
                <div>
                  <p className="font-medium">
                    {getFileIcon(f.mimeType)} {f.originalName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getFileTypeLabel(f.mimeType)} • {formatSize(f.sizeBytes)}
                  </p>
                </div>

                <Button size="sm" variant="outline" className="shrink-0 ml-3">
                  Download →
                </Button>
              </a>
            </li>
          ))}
        </ul>
      )}

      {!data?.textContent && (!data?.files || data.files.length === 0) && (
        <div className="text-center py-12 space-y-2">
          <div className="text-4xl">📭</div>
          <h2 className="font-semibold">Nothing was shared.</h2>
          <p className="text-sm text-muted-foreground">
            This link doesn&apos;t contain any files or text.
          </p>
        </div>
      )}
    </main>
  );
}
