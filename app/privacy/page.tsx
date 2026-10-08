import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Database,
  KeyRound,
  Laptop,
  ShieldAlert,
  Lock,
  RefreshCw,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How ClipDrop processes temporary files, text snippets, device registrations, and automated data deletion.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16 space-y-10 animate-in fade-in duration-200">
      {/* Header */}
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 rounded-md py-1 px-1.5 -ml-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/50 px-2.5 py-0.5 text-[11px] font-mono font-medium text-muted-foreground">
            <Lock className="h-3 w-3 text-brand-400" />
            <span>Transparency &amp; Governance</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Privacy{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-400 to-indigo-300">
              Policy
            </span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            A transparent, technical description of how ClipDrop handles file
            transit, encrypted text storage, device identification, and
            automated data destruction.
          </p>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5 flex items-start gap-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-0.5">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
          <p className="font-semibold text-foreground">
            Operational Scope &amp; Sensitive Data Notice
          </p>
          <p>
            ClipDrop is engineered as a fast, ephemeral transfer bridge between
            devices. ClipDrop does not provide end-to-end client-side
            encryption. Please do not upload sensitive financial credentials,
            government IDs, or confidential material you would not process
            across cloud services.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-muted-foreground">
        {/* Section 1 */}
        <section className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6 shadow-xs">
          <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
            <Database className="h-4 w-4 text-brand-400" />
            <span>1. Information We Process</span>
          </h2>
          <p>
            When utilizing ClipDrop, our infrastructure processes only the data
            strictly necessary to execute transfer and device synchronization:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-xs">
            <li>
              <strong className="text-foreground">Uploaded Files:</strong> File
              assets (capped at 10 MB per file) are temporarily uploaded to
              secure cloud storage for recipient retrieval.
            </li>
            <li>
              <strong className="text-foreground">Text &amp; Notes:</strong>{" "}
              Monospace code snippets and text notes are stored in our
              relational database throughout the active share lifespan.
            </li>
            <li>
              <strong className="text-foreground">Share Metadata:</strong>{" "}
              Unpredictable 6-digit alphanumeric codes, file size metadata, MIME
              types, and password hashes (salted and hashed with bcrypt) are
              stored.
            </li>
            <li>
              <strong className="text-foreground">Clipboard Transit:</strong>{" "}
              For signed-in users with clipboard synchronization active,
              clipboard text is securely routed through the database to
              connected devices.
            </li>
            <li>
              <strong className="text-foreground">Device Identifiers:</strong>{" "}
              Browser client UUIDs, device user-agent labels, and last-seen
              activity timestamps are stored to manage paired sync sessions.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6 shadow-xs">
          <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-400" />
            <span>2. Expiration &amp; Automated Destruction</span>
          </h2>
          <p>ClipDrop operates strictly on bounded, finite lifecycles:</p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-xs">
            <li>
              <strong className="text-foreground">
                Configured Expiration:
              </strong>{" "}
              Shares naturally expire after the creator&apos;s specified
              duration (10 minutes, 1 hour, 24 hours, or 7 days).
            </li>
            <li>
              <strong className="text-foreground">
                Download Limits &amp; One-Time Burn:
              </strong>{" "}
              Once a share reaches its download ceiling, or when a one-time burn
              share is viewed, access is irrevocably sealed.
            </li>
            <li>
              <strong className="text-foreground">
                Automated Cleanup Routine:
              </strong>{" "}
              A scheduled background cron worker regularly purges all expired
              and consumed shares, removing database records and deleting stored
              assets from Cloudinary.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6 shadow-xs">
          <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-brand-400" />
            <span>3. Authentication &amp; Third-Party Infrastructure</span>
          </h2>
          <p>
            To deliver secure authentication and resilient delivery, ClipDrop
            relies on industry-standard providers:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-xs">
            <li>
              <strong className="text-foreground">
                Authentication (Clerk):
              </strong>{" "}
              User sessions and authentication flows are managed by Clerk. User
              passwords are never handled or stored directly by ClipDrop.
            </li>
            <li>
              <strong className="text-foreground">
                Cloud Storage (Cloudinary):
              </strong>{" "}
              Uploaded files are hosted on Cloudinary and accessible via
              authenticated links until purged by our automated cleaner.
            </li>
            <li>
              <strong className="text-foreground">Relational Database:</strong>{" "}
              Metadata, device registrations, and transit records reside in
              managed PostgreSQL database clusters.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6 shadow-xs">
          <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
            <Laptop className="h-4 w-4 text-brand-400" />
            <span>4. User Sovereignty &amp; Data Control</span>
          </h2>
          <p>You have continuous control over your active assets:</p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-xs">
            <li>
              <strong className="text-foreground">
                Immediate Share Deletion:
              </strong>{" "}
              You can delete any active share at any time from your{" "}
              <Link
                href="/dashboard"
                className="text-brand-400 hover:underline font-medium"
              >
                Dashboard
              </Link>
              , immediately purging the database record and initiating cloud
              asset removal.
            </li>
            <li>
              <strong className="text-foreground">
                Device Session Revocation:
              </strong>{" "}
              Registered browser sessions can be renamed or permanently
              disconnected via the{" "}
              <Link
                href="/dashboard/devices"
                className="text-brand-400 hover:underline font-medium"
              >
                Devices
              </Link>{" "}
              interface.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-2 rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6 shadow-xs">
          <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-brand-400" />
            <span>5. Revisions to This Policy</span>
          </h2>
          <p className="text-xs">
            If operational infrastructure, security practices, or regulatory
            requirements change, updates will be reflected directly on this
            policy page.
          </p>
        </section>
      </div>
    </main>
  );
}
