"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShareResult } from "./ShareResult";

export function UploadZone() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [oneTimeUse, setOneTimeUse] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => setFiles((f) => [...f, ...accepted]), []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  async function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) setFiles((f) => [...f, file]);
      }
    }
  }

  async function handleUpload() {
    if (!text && files.length === 0) {
      toast.error("Add text or a file first");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      if (text) formData.append("text", text);
      files.forEach((f) => formData.append("files", f));
      if (password) {
      formData.append("password", password);
      }
      formData.append("oneTimeUse",oneTimeUse ? "true" : "false");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data.code);
      toast.success("Uploaded! Code: " + data.code);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4" onPaste={handlePaste}>
      <div
        {...getRootProps()}
        className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors
          ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30"}`}
      >
        <input {...getInputProps()} />
        <p className="text-muted-foreground">
          Drag files here, click to browse, or paste an image
        </p>
      </div>

      {files.length > 0 && (
        <ul className="text-sm text-muted-foreground">
          {files.map((f, i) => <li key={i}>{f.name}</li>)}
        </ul>
      )}

      <Textarea
        placeholder="Or paste/type text..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
      />

      <div className="space-y-3">
      <Input
      type="password"
      placeholder="Password (optional)"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
        />
      <label className="flex items-center gap-2 text-sm">
      <input
      type="checkbox"
      checked={oneTimeUse}
      onChange={(e) => setOneTimeUse(e.target.checked)}
      />
      Delete after first download
      </label>
      </div>

      <Button onClick={handleUpload} disabled={loading} className="w-full">
        {loading ? "Uploading..." : "Create Share"}
      </Button>

      {result && <ShareResult code={result} />}
    </div>
  );
}