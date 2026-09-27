import type { Metadata } from "next";
import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-20 sm:py-32 text-center">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
          <FileQuestion className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-flex rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
            404
          </span>
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The page you are looking for does not exist, has expired, or has
            been moved.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
