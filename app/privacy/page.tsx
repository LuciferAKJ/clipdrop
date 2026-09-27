import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Database,
  KeyRound,
  Laptop,
  ShieldAlert,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How ClipDrop processes temporary files, text snippets, device registrations, and automated data deletion.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16 space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-border/80 pb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Legal &amp; Transparency
          </span>
          <h1 className="mt-1 font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            An accurate description of how ClipDrop handles file uploads, text
            notes, device registrations, and data lifecycles.
          </p>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 sm:p-5 flex items-start gap-3.5">
        <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
          <p className="font-semibold text-foreground">
            Important Notice on Sensitive Data
          </p>
          <p>
            ClipDrop is designed for convenient temporary transfer of files and
            text across your devices. ClipDrop does not provide end-to-end
            encryption. Please do not upload sensitive personal, financial, or
            confidential information that you are not comfortable processing
            through cloud services.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <span>1. Information We Process</span>
          </h2>
          <p>
            When you use ClipDrop, we process only the data required to
            facilitate temporary transfer and device synchronization:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs">
            <li>
              <strong className="text-foreground">Uploaded Files:</strong> File
              data (up to 10 MB per file) is uploaded to our cloud storage
              provider to enable recipient downloads.
            </li>
            <li>
              <strong className="text-foreground">Text &amp; Notes:</strong>{" "}
              Text or code snippets submitted through the transfer form are
              stored in our database during their active share lifespan.
            </li>
            <li>
              <strong className="text-foreground">Share Metadata:</strong> A
              random alphanumeric share code, file names, file sizes, MIME
              types, and optional password hashes (hashed with bcrypt) are
              recorded.
            </li>
            <li>
              <strong className="text-foreground">Clipboard Data:</strong> For
              signed-in users using clipboard synchronization, active clipboard
              text is temporarily routed through the database to connected
              devices.
            </li>
            <li>
              <strong className="text-foreground">Device Identifiers:</strong> A
              browser client identifier, device label, and timestamp of last
              activity are stored to identify your paired devices.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>2. Expiration &amp; Automated Deletion</span>
          </h2>
          <p>
            ClipDrop is built around finite lifecycles rather than permanent
            storage:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs">
            <li>
              <strong className="text-foreground">
                Configured Expiration:
              </strong>{" "}
              Each share expires after a selected duration (10 minutes, 1 hour,
              24 hours, or 7 days).
            </li>
            <li>
              <strong className="text-foreground">
                Download Limits &amp; One-Time Use:
              </strong>{" "}
              When a share reaches its specified download limit, or when a
              one-time view share is opened, access is immediately blocked.
            </li>
            <li>
              <strong className="text-foreground">
                Automated Cleanup Routine:
              </strong>{" "}
              An automated background cleanup task periodically purges expired
              and consumed shares, deleting associated database records and
              initiating deletion of stored files from Cloudinary. Deletion
              occurs as part of this scheduled maintenance and is not
              instantaneous to the millisecond.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <span>3. Authentication &amp; Third-Party Service Providers</span>
          </h2>
          <p>
            To deliver the service, ClipDrop integrates with the following
            third-party service providers:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs">
            <li>
              <strong className="text-foreground">
                Authentication (Clerk):
              </strong>{" "}
              User accounts, session management, and login flows are provided by
              Clerk. We do not store your account passwords directly.
            </li>
            <li>
              <strong className="text-foreground">
                File Storage (Cloudinary):
              </strong>{" "}
              Uploaded file assets are temporarily hosted on Cloudinary and
              served via secure links until purged by our cleanup routine.
            </li>
            <li>
              <strong className="text-foreground">Database Hosting:</strong>{" "}
              Share metadata, device registrations, and clipboard transit
              records are stored in managed PostgreSQL database infrastructure.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
            <Laptop className="h-4 w-4 text-primary" />
            <span>4. User Control &amp; Data Management</span>
          </h2>
          <p>You can manually manage your active data at any time:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs">
            <li>
              <strong className="text-foreground">
                Manual Share Deletion:
              </strong>{" "}
              Authenticated users can delete active shares immediately from the{" "}
              <Link href="/dashboard" className="text-primary hover:underline">
                Dashboard
              </Link>
              , which purges the database record and initiates file deletion.
            </li>
            <li>
              <strong className="text-foreground">Device Removal:</strong>{" "}
              Registered browser sessions can be renamed or disconnected via the{" "}
              <Link
                href="/dashboard/devices"
                className="text-primary hover:underline"
              >
                Devices
              </Link>{" "}
              page.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-foreground">
            5. Changes to This Policy
          </h2>
          <p className="text-xs">
            We may update this policy if technical capabilities, service
            providers, or operational behaviors change. Any updates will be
            reflected directly on this page.
          </p>
        </section>
      </div>
    </main>
  );
}
