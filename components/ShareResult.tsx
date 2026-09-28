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
    QRCode.toCanvas(canvasRef.current, url, {
      width: 170,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
  }, [code]);

  const handleCopy = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/s/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, [code]);

  const handleCopyCode = useCallback(() => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(code);
    toast.success("Share code copied");
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }, [code]);

  const shareHref = `/s/${code}`;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6 text-center">
      {/* Confirmation header */}
      <div className="space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
          <Check className="h-6 w-6 stroke-[2.5]" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">
            Share Ready
          </h2>
          <p className="text-xs text-muted-foreground">
            Anyone with the code or link can access this share
          </p>
        </div>
      </div>

      {/* Share Code Presentation */}
      <div className="rounded-xl border border-border/80 bg-secondary/40 p-4 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Share Code
        </p>
        <p className="text-3xl sm:text-4xl font-mono font-bold tracking-[0.25em] text-foreground break-all select-all">
          {code}
        </p>
        <button
          type="button"
          onClick={handleCopyCode}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-95"
        >
          {copiedCode ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{copiedCode ? "Code copied" : "Copy code"}</span>
        </button>
      </div>

      {/* QR Code Container */}
      <div className="space-y-2">
        <div className="flex justify-center">
          <div className="rounded-xl border border-white/20 bg-white p-2.5 shadow-sm">
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={`QR Code for share ${code}`}
              className="mx-auto rounded-lg"
            />
          </div>
        </div>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Scan with another device to open instantly</span>
        </p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
        <Button
          variant="outline"
          size="lg"
          className="h-11 min-h-[44px] w-full"
          onClick={handleCopy}
        >
          {copiedLink ? (
            <Check className="h-4 w-4 mr-2 text-emerald-400" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          <span>{copiedLink ? "Link Copied" : "Copy Link"}</span>
        </Button>

        <a
          href={shareHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open share ${code} in new tab`}
          className="inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-all hover:bg-secondary active:scale-[0.98]"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          <span>Open Share</span>
          <span className="sr-only">(opens in new tab)</span>
        </a>
      </div>

      <Button
        variant="ghost"
        size="lg"
        className="w-full h-11 min-h-[44px] text-xs text-muted-foreground hover:text-foreground"
        onClick={onReset}
      >
        Create Another Share
      </Button>
    </div>
  );
}
