"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, QrCode } from "lucide-react";

export function ShareResult({
  code,
  onReset,
}: {
  code: string;
  onReset: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, [code]);

  const handleCopyCode = useCallback(() => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(code);
    toast.success("Code copied");
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }, [code]);

  const shareHref = `/s/${code}`;

  return (
    <div className="rounded-2xl border bg-card shadow-sm p-6 sm:p-8 space-y-6 text-center">
      {/* Success confirmation */}
      <div className="space-y-1.5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
          <Check className="h-6 w-6 text-emerald-500" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Your share is ready
        </p>
      </div>

      {/* Share code */}
      <div className="space-y-2">
        <p className="text-3xl sm:text-4xl font-mono font-bold tracking-[0.2em] break-all">
          {code}
        </p>
        <button
          onClick={handleCopyCode}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {copiedCode ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copiedCode ? "Copied" : "Copy code"}
        </button>
      </div>

      {/* QR section */}
      <div className="flex justify-center">
        <div className="rounded-xl border bg-white p-3 shadow-sm">
          <canvas ref={canvasRef} className="mx-auto rounded-lg" />
        </div>
      </div>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <QrCode className="h-3.5 w-3.5" />
        Scan to open on another device
      </p>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
        <Button
          variant="outline"
          className="h-10 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          onClick={handleCopy}
        >
          {copiedLink ? (
            <Check className="h-4 w-4 mr-1.5" />
          ) : (
            <Copy className="h-4 w-4 mr-1.5" />
          )}
          {copiedLink ? "Copied" : "Copy Link"}
        </Button>

        <a
          href={shareHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98]"
        >
          <ExternalLink className="h-4 w-4" />
          Open Share
        </a>
      </div>

      <Button
        variant="ghost"
        className="w-full h-10 text-muted-foreground hover:text-foreground"
        onClick={onReset}
      >
        Create Another Share
      </Button>
    </div>
  );
}
