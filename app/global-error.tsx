"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";
import { AlertOctagon, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Root layout error", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased min-h-screen flex items-center justify-center p-4 font-sans">
        <main
          className="max-w-md w-full rounded-2xl border border-border/80 bg-card/90 p-6 sm:p-8 text-center space-y-4 shadow-xl shadow-black/40 backdrop-blur-md"
          role="alert"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive border border-destructive/20">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold text-foreground tracking-tight">
              Application error
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              An unexpected root error occurred. Please retry or refresh the
              page.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={reset}
              className="inline-flex h-9.5 min-h-[38px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs shadow-primary/25 transition-all hover:bg-primary/90 active:scale-[0.985]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Try again</span>
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
