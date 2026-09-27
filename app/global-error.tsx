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
      <body className="bg-background text-foreground antialiased min-h-screen flex items-center justify-center p-4">
        <main
          className="max-w-md w-full rounded-2xl border border-border bg-card p-6 sm:p-8 text-center space-y-4 shadow-xs"
          role="alert"
        >
          <h1 className="font-heading text-lg font-bold text-foreground">
            Application error
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            An unexpected error occurred in the application root. Please reload
            the page to continue.
          </p>
          <div className="pt-2">
            <button
              onClick={reset}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs shadow-primary/20 transition-all hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
