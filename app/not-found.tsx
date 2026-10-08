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
      <div className="rounded-2xl border border-border/80 bg-card/80 p-6 sm:p-8 shadow-sm shadow-black/30 backdrop-blur-md space-y-5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/80 text-primary border border-border/70">
          <FileQuestion className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-flex rounded-full border border-border/80 bg-secondary/60 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
            404
          </span>
          <h1 className="font-heading text-lg font-bold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
            The share or page you are looking for does not exist, has expired,
            or has reached its download limit.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex h-9.5 min-h-[38px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs shadow-primary/25 transition-all hover:bg-primary/90 active:scale-[0.985]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
