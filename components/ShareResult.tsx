"use client";
import { useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ShareResult({
  code,
  onReset,
}: {
  code: string;
  onReset: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current) return;
    const url = `${window.location.origin}/s/${code}`;
    QRCode.toCanvas(canvasRef.current, url, { width: 180, margin: 1 });
  }, [code]);

  const handleCopy = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/s/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }, [code]);

  return (
    <div className="rounded-xl border p-6 text-center space-y-4">
      <p className="text-2xl font-mono font-bold tracking-widest">{code}</p>
      <canvas ref={canvasRef} className="mx-auto rounded-lg bg-white p-2" />
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={handleCopy}>
          Copy Link
        </Button>
        <Button variant="ghost" className="flex-1" onClick={onReset}>
          Create Another
        </Button>
      </div>
    </div>
  );
}
