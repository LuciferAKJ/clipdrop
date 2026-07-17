"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ReceivePage() {
  const { code } = useParams<{ code: string }>();
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/share/${code}`)
      .then((r) => r.json())
      .then((meta) => {
        if (meta.error) throw new Error(meta.error);
        setNeedsPassword(meta.requiresPassword);
        if (!meta.requiresPassword) fetchContent();
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [code]);

  async function fetchContent() {
    setLoading(true);
    try {
      const res = await fetch(`/api/share/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
      setNeedsPassword(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <main className="max-w-xl mx-auto p-8"><Skeleton className="h-40 w-full" /></main>;
  if (error) return <main className="max-w-xl mx-auto p-8 text-destructive">{error}</main>;

  if (needsPassword) {
  return (
    <main className="max-w-sm mx-auto p-8 space-y-4">
      <h2 className="text-xl font-semibold">
        Password Required
      </h2>

      <p className="text-sm text-muted-foreground">
        This share is protected with a password.
      </p>

      <Input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button onClick={fetchContent} className="w-full">
        Unlock
      </Button>
    </main>
  );
}

  return (
    <main className="max-w-xl mx-auto p-8 space-y-4">
      {data?.textContent && (
        <div className="rounded-lg border p-4 whitespace-pre-wrap">{data.textContent}</div>
      )}
      {data?.files?.map((f: any) => (
        <a key={f.id} href={f.url} target="_blank" className="block rounded-lg border p-4 hover:bg-muted">
          {f.originalName} ({(f.sizeBytes / 1024).toFixed(1)} KB)
        </a>
      ))}
    </main>
  );
}