// app/error.tsx
"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Route error boundary triggered", error);
  }, [error]);

  return (
    <main
      className="max-w-md mx-auto px-4 py-20 sm:py-28 text-center"
      role="alert"
    >
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-heading text-lg font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            An unexpected error occurred. You can retry the operation or return
            to the home page.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            className="h-10 text-xs"
          >
            Try again
          </Button>
          <Button
            size="sm"
            onClick={() => (window.location.href = "/")}
            className="h-10 text-xs"
          >
            Go home
          </Button>
        </div>
      </div>
    </main>
  );
}
