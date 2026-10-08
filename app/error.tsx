"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    logger.error("Route error boundary triggered", error);
  }, [error]);

  return (
    <main
      className="max-w-md mx-auto px-4 py-20 sm:py-28 text-center"
      role="alert"
    >
      <div className="rounded-2xl border border-border/80 bg-card/80 p-6 sm:p-8 shadow-sm shadow-black/30 backdrop-blur-md space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive border border-destructive/20">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-heading text-lg font-bold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            An unexpected error occurred during transit. You can retry the
            operation or return to the main dashboard.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            className="h-9.5 text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Try again</span>
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/")}
            className="h-9.5 text-xs gap-1.5"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Go home</span>
          </Button>
        </div>
      </div>
    </main>
  );
}
