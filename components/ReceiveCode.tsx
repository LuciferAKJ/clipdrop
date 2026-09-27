"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, KeyRound, ClipboardPaste } from "lucide-react";
import { toast } from "sonner";

export function ReceiveCode() {
  const [code, setCode] = useState("");
  const router = useRouter();

  function handleOpen() {
    if (!code.trim()) return;
    router.push(`/s/${code.trim().toUpperCase()}`);
  }

  async function handlePasteCode() {
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim().toUpperCase();
      if (trimmed) {
        // If user pasted a full URL, extract the code
        const match = trimmed.match(/\/s\/([A-Z0-9]+)/i);
        const extracted = match ? match[1] : trimmed;
        setCode(extracted);
        toast.info("Pasted code from clipboard");
      }
    } catch {
      toast.error("Unable to read clipboard");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-xs flex flex-col justify-between">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
            <KeyRound className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
              Receive a Share
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter the unique 6-character code to retrieve shared files or
              text.
            </p>
          </div>
        </div>

        {/* Code Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="share-code"
              className="text-xs font-medium text-muted-foreground"
            >
              Share code
            </label>
            <button
              type="button"
              onClick={handlePasteCode}
              className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline transition-colors"
            >
              <ClipboardPaste className="h-3 w-3" />
              <span>Paste from clipboard</span>
            </button>
          </div>

          <Input
            id="share-code"
            placeholder="e.g. B7ZSJF"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleOpen();
              }
            }}
            maxLength={20}
            autoComplete="off"
            className="h-12 text-center font-mono text-lg font-bold tracking-[0.2em] uppercase bg-secondary/30"
          />
        </div>

        {/* Open Button */}
        <Button
          onClick={handleOpen}
          disabled={!code.trim()}
          size="lg"
          className="h-11 w-full text-sm font-semibold tracking-wide"
        >
          <span>Open Share</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="pt-6 mt-6 border-t border-border/60">
        <p className="text-center text-xs text-muted-foreground">
          Protected shares will prompt for password upon opening.
        </p>
      </div>
    </div>
  );
}
