"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  KeyRound,
  ClipboardPaste,
  Loader2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

export function ReceiveCode() {
  const [code, setCode] = useState("");
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();

  function handleOpen() {
    if (!code.trim() || navigating) return;
    setNavigating(true);
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
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div>
            <h2 className="font-heading text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Receive a Share</span>
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Retrieve files or notes using a 6-character transit code.
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary border border-border/60">
            <KeyRound className="h-5 w-5 stroke-[1.75]" />
          </div>
        </div>

        {/* Code Input */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="share-code"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Transit Code
            </label>
            <button
              type="button"
              onClick={handlePasteCode}
              disabled={navigating}
              className="inline-flex items-center gap-1.5 py-1 px-2 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors min-h-[44px] -my-2"
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              <span>Paste from clipboard</span>
            </button>
          </div>

          <div className="relative">
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
              disabled={navigating}
              maxLength={20}
              autoComplete="off"
              className="h-14 text-center font-mono text-xl sm:text-2xl font-bold tracking-[0.25em] uppercase bg-secondary/30 border-border/80 focus:border-primary focus:ring-primary/25"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Codes are case-insensitive and generated at upload.
          </p>
        </div>

        {/* Open Button */}
        <Button
          onClick={handleOpen}
          disabled={!code.trim() || navigating}
          size="lg"
          className="h-12 w-full text-sm font-semibold tracking-wide shadow-md shadow-primary/10"
        >
          {navigating ? (
            <>
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              <span>Locating Share...</span>
            </>
          ) : (
            <>
              <span>Access Shared Content</span>
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>

      <div className="pt-4 border-t border-border/40">
        <div className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
          <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            Protected or one-time shares will prompt for required verification
            before revealing content.
          </span>
        </div>
      </div>
    </div>
  );
}
