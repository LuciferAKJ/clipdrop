"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, KeyRound } from "lucide-react";

export function ReceiveCode() {
  const [code, setCode] = useState("");
  const router = useRouter();

  function handleOpen() {
    if (!code.trim()) return;

    router.push(`/s/${code.trim().toUpperCase()}`);
  }

  return (
    <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Receive a Share
            </h2>

            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter the share code someone sent you.
            </p>
          </div>
        </div>

        {/* Code input */}
        <div className="space-y-2">
          <label htmlFor="share-code" className="text-sm font-medium">
            Share code
          </label>

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
            className="h-11 font-mono tracking-widest uppercase"
          />
        </div>

        {/* Open button */}
        <Button
          onClick={handleOpen}
          disabled={!code.trim()}
          className="h-11 w-full transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          Open Share
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Your share may require a password to access.
        </p>
      </div>
    </div>
  );
}
