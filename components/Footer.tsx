"use client";

import Link from "next/link";
import { Show } from "@clerk/nextjs";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-background/60 py-8 sm:py-10 transition-colors">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand & Mission */}
        <div className="flex flex-col items-center sm:items-start gap-1.5 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-xs tracking-tight text-foreground">
              ClipDrop
            </span>
            <span className="rounded-full border border-border/80 bg-secondary/50 px-2 py-0.2 font-mono text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              transit
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground max-w-sm leading-relaxed">
            Ephemeral transit for files, notes, and clipboard streams with
            cryptographic integrity.
          </p>
        </div>

        {/* Links */}
        <nav
          className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground font-medium"
          aria-label="Footer Navigation"
        >
          <Link
            href="/"
            className="hover:text-foreground transition-colors outline-none focus-visible:underline"
          >
            Home
          </Link>
          <Link
            href="/privacy"
            className="hover:text-foreground transition-colors outline-none focus-visible:underline"
          >
            Privacy
          </Link>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="hover:text-foreground transition-colors outline-none focus-visible:underline"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/devices"
              className="hover:text-foreground transition-colors outline-none focus-visible:underline"
            >
              Devices
            </Link>
          </Show>
        </nav>

        {/* Note */}
        <div className="text-center sm:text-right font-mono text-[10px] text-muted-foreground/80">
          <span>Auto-expiring · Zero persistent clutter</span>
        </div>
      </div>
    </footer>
  );
}
