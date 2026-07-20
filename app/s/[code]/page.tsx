"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { TextViewer } from "@/components/share/TextViewer";

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

export default function ReceivePage() {
  const { code } = useParams<{ code: string }>();
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable per `code` — takes password as a parameter rather than
  // reading it from closure, so this identity doesn't change on every
  // keystroke and can safely be listed as an effect dependency.
  const fetchContent = useCallback(
    async (pw?: string) => {
      setChecking(true);
      try {
        const res = await fetch(`/api/share/${code}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pw || undefined }),
        });
        const json: ShareData & ShareApiError = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to retrieve");

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
        if (!res.ok) throw new Error(meta.error || "Not found");
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
      <main className="max-w-xl mx-auto p-8">
        <p className="text-destructive font-medium">{error}</p>
      </main>
    );
  }

  if (needsPassword) {
    return (
      <main className="max-w-sm mx-auto p-8 space-y-3">
        <h1 className="text-xl font-semibold">Password required</h1>
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
    <main className="max-w-xl mx-auto p-8 space-y-4">
      <h1 className="text-xl font-semibold">Shared content</h1>

      {data?.textContent && <TextViewer text={data.textContent} />}

      {data?.files && data.files.length > 0 && (
        <ul className="space-y-2">
          {data.files.map((f) => (
            <li key={f.id}>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between items-center rounded-lg border p-4 hover:bg-muted transition-colors"
              >
                <span className="truncate">{f.originalName}</span>
                <span className="text-sm text-muted-foreground shrink-0 ml-3">
                  {(f.sizeBytes / 1024).toFixed(1)} KB
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {!data?.textContent && (!data?.files || data.files.length === 0) && (
        <p className="text-muted-foreground">No content available.</p>
      )}
    </main>
  );
}
