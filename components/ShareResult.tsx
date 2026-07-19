"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ShareResultProps = {
  code: string;
  onReset: () => void;
};

export function ShareResult({ code, onReset }: ShareResultProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/s/${code}`
      : "";

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, { width: 180 });
    }
  }, [url]);

  return (
    <div className="rounded-xl border p-6 text-center space-y-3">
      <p className="text-2xl font-mono font-bold tracking-widest">
        {code}
      </p>

      <canvas ref={canvasRef} className="mx-auto rounded-lg" />

      <Button
        variant="outline"
        onClick={() => {
          navigator.clipboard.writeText(url);
          toast.success("Link copied");
        }}
      >
        Copy Link
      </Button>

      <Button onClick={onReset}>
        Create Another Share
      </Button>
    </div>
  );
}