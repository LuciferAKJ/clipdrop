import { UploadZone } from "@/components/UploadZone";
import { ReceiveCode } from "@/components/ReceiveCode";
import { ShieldCheck, Zap, Clock } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
      {/* Hero Header */}
      <div className="mb-10 sm:mb-14 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3.5 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span>Temporary Transit · Auto-expiring</span>
        </div>

        <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
          Share Files &amp; <span className="text-primary">Text</span> Instantly
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
          Transfer documents, code snippets, notes, and archives with optional
          password protection, download limits, and automatic expiration.
        </p>
      </div>

      {/* Main Hub: Upload & Receive */}
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <UploadZone />
        <ReceiveCode />
      </div>

      {/* Value Pillars */}
      <div className="mt-16 sm:mt-20 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/80 bg-card/60 p-5 sm:p-6 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary mb-3.5">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-sm font-semibold text-foreground">
            Controlled Access
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Protect sensitive shares with passwords, customize lifespan from 1
            hour to 30 days, or limit download counts.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/60 p-5 sm:p-6 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary mb-3.5">
            <Zap className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-sm font-semibold text-foreground">
            Fast Transfers
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Drop files, paste images directly from your clipboard, or share code
            snippets with automatic language detection.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/60 p-5 sm:p-6 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary mb-3.5">
            <Clock className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-sm font-semibold text-foreground">
            Ephemeral by Design
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            No permanent clutter. Files and text automatically expire based on
            your chosen duration or download limit.
          </p>
        </div>
      </div>
    </main>
  );
}
