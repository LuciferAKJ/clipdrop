// app/error.tsx
"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

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
      className="max-w-md mx-auto px-4 py-24 text-center space-y-4"
      role="alert"
    >
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">
        An unexpected error occurred. You can try again, or head back home.
      </p>
      <div className="flex justify-center gap-2">
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
        <Button onClick={() => (window.location.href = "/")}>Go home</Button>
      </div>
    </main>
  );
}
