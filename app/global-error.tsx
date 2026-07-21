// app/global-error.tsx — catches errors in the root layout itself
"use client";
import { useEffect } from "react";
import { logger } from "@/lib/logger";

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
      <body>
        <main
          className="max-w-md mx-auto px-4 py-24 text-center space-y-4"
          role="alert"
        >
          <h1 className="text-xl font-semibold">Application error</h1>
          <p className="text-muted-foreground text-sm">
            Please refresh the page.
          </p>
          <button onClick={reset} className="underline text-sm">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
