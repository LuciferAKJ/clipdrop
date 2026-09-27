import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/80 bg-background/80 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand & Mission */}
        <div className="flex flex-col items-center sm:items-start gap-1.5 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-sm tracking-tight text-foreground">
              ClipDrop
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Transit
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm">
            Temporary, auto-expiring transit for files, text snippets, and
            clipboards across devices.
          </p>
        </div>

        {/* Links */}
        <nav
          className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground"
          aria-label="Footer Navigation"
        >
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <Link
            href="/dashboard"
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/devices"
            className="hover:text-foreground transition-colors"
          >
            Devices
          </Link>
        </nav>

        {/* Note */}
        <div className="text-center sm:text-right text-[11px] text-muted-foreground">
          <span>Files and text expire automatically.</span>
        </div>
      </div>
    </footer>
  );
}
