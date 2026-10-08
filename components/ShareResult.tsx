"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, QrCode, Plus } from "lucide-react";

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
      width: 160,
      margin: 1,
      color: {
        dark: "#0b0f19",
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
    <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6 text-center">
      {/* Confirmation header */}
      <div className="space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs">
          <Check className="h-6 w-6 stroke-[2.5]" />
        </div>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            <span>TRANSIT CODE ACTIVE</span>
          </div>
          <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Share Ready for Retrieval
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Anyone with the 6-character code or direct link can access this
            content.
          </p>
        </div>
      </div>

      {/* Share Code Presentation */}
      <div className="rounded-2xl border border-border/80 bg-secondary/30 p-5 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Share Code
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            Case-insensitive
          </span>
        </div>

        <div className="rounded-xl bg-card border border-border/70 p-3.5 flex items-center justify-center">
          <p className="text-3xl sm:text-4xl font-mono font-extrabold tracking-[0.25em] text-foreground break-all select-all">
            {code}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyCode}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-secondary/50 px-4 py-2 text-xs font-medium text-foreground transition-all hover:bg-secondary hover:border-border active:scale-[0.985] w-full min-h-[44px]"
        >
          {copiedCode ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold text-emerald-400">
                Code Copied
              </span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 text-primary" />
              <span>Copy 6-Digit Code</span>
            </>
          )}
        </button>
      </div>

      {/* QR Code Container */}
      <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 space-y-2.5">
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
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-mono">
          <QrCode className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span>Scan to open directly on mobile</span>
        </p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <Button
          variant="outline"
          size="lg"
          className="h-12 min-h-[44px] w-full text-xs font-semibold"
          onClick={handleCopy}
        >
          {copiedLink ? (
            <>
              <Check className="h-4 w-4 mr-2 text-emerald-400" />
              <span>Link Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2 text-primary" />
              <span>Copy Full Link</span>
            </>
          )}
        </Button>

        <a
          href={shareHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open share ${code} in new tab`}
          className="inline-flex h-12 min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs transition-all hover:bg-primary/90 active:scale-[0.985] shadow-sm shadow-primary/20"
        >
          <span>Open Share</span>
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">(opens in new tab)</span>
        </a>
      </div>

      <div className="border-t border-border/40 pt-4">
        <Button
          variant="ghost"
          size="lg"
          className="w-full h-11 min-h-[44px] text-xs text-muted-foreground hover:text-foreground"
          onClick={onReset}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          <span>Create Another Share</span>
        </Button>
      </div>
    </div>
  );
}
