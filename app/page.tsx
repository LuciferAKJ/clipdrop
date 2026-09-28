import { UploadZone } from "@/components/UploadZone";
import { ReceiveCode } from "@/components/ReceiveCode";
import { ShieldCheck, Zap, Clock, HelpCircle, ChevronDown } from "lucide-react";

const FAQS = [
  {
    question: "Do recipients need an account to download files?",
    answer:
      "No. Anyone with the 6-character share code or direct link can access and download shared files or view notes immediately without creating an account or logging in.",
  },
  {
    question: "How long do shares remain available?",
    answer:
      "The creator chooses the lifespan during upload: 1 hour, 6 hours, 24 hours (default), 7 days, or 30 days. Once the expiration window passes, the share is no longer available and is cleaned up by the automated cleanup process.",
  },
  {
    question: "What is the file size limit and what formats are supported?",
    answer:
      "Each file can be up to 10 MB. ClipDrop supports any file format, including documents (PDF, Word), images, audio, video recordings, archive packages (ZIP, RAR, 7z), code source files, and text notes.",
  },
  {
    question: 'What does "Delete after first download (one-time view)" do?',
    answer:
      "When enabled, the share is limited to a single access. Once the content is viewed or downloaded for the first time, it is marked as consumed and cannot be accessed again. The consumed share is then cleaned up by the automated cleanup process, which removes the share record and its stored file assets when cleanup succeeds.",
  },
  {
    question:
      "What is clipboard synchronization and do I need an account for it?",
    answer:
      "Clipboard synchronization allows you to transfer copied text snippets across your own connected devices. Yes, a free account is required for this feature so your devices can be securely registered and managed from your dashboard.",
  },
];

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

      {/* Frequently Asked Questions */}
      <section className="mt-16 sm:mt-24 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            <span>Questions &amp; Answers</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-muted-foreground">
            Everything you need to know about sharing, expiration, and privacy
            on ClipDrop.
          </p>
        </div>

        <div className="mx-auto max-w-3xl space-y-3 pt-2">
          {FAQS.map((faq, index) => (
            <details
              key={index}
              className="group rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 transition-colors open:bg-card hover:border-border"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-lg py-0.5 [&::-webkit-details-marker]:hidden">
                <span className="pr-4">{faq.question}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground border-t border-border/50 pt-3">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
