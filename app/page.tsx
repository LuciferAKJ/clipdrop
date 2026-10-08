import { UploadZone } from "@/components/UploadZone";
import { ReceiveCode } from "@/components/ReceiveCode";
import { Zap, Clock, HelpCircle, ChevronDown, Lock } from "lucide-react";

const FAQS = [
  {
    question: "Do recipients need an account to download files?",
    answer:
      "No. Anyone with the 6-character share code or direct link can access and download shared files or view notes immediately without creating an account or logging in.",
  },
  {
    question: "How long do shares remain available?",
    answer:
      "The creator chooses the lifespan during upload: 1 hour, 6 hours, 12 hours, 24 hours (1 day), 3 days, 7 days, or 30 days. Once the expiration window passes, the share is permanently unlinked and purged by automated background cleanup.",
  },
  {
    question: "What is the file size limit and what formats are supported?",
    answer:
      "Each file can be up to 10 MB. ClipDrop supports any file format, including documents (PDF, Office), images, audio, video recordings, archive packages (ZIP, RAR, 7z, tar.gz), source code files, and plaintext notes.",
  },
  {
    question: 'What does "Delete after first download (one-time view)" do?',
    answer:
      "When enabled, the share is limited to a single access. Once the content is revealed or downloaded for the first time, it is marked as consumed and cannot be accessed again by anyone.",
  },
  {
    question:
      "What is clipboard synchronization and do I need an account for it?",
    answer:
      "Clipboard synchronization allows you to transfer copied text snippets across your own authenticated devices seamlessly. A free account is required for this feature so your devices can be securely registered and managed from your dashboard.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-14 space-y-12 sm:space-y-16">
      {/* Hero Header */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/50 px-3.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="font-mono text-[11px] tracking-wide text-foreground">
            TRANSIT PROTOCOL V2
          </span>
          <span className="text-border">|</span>
          <span>Zero-Retention Ephemeral Transfer</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
          Fast, Ephemeral <br />
          <span className="bg-gradient-to-r from-primary via-indigo-400 to-primary/80 bg-clip-text text-transparent">
            File &amp; Text Transfer
          </span>
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Transfer documents, code snippets, notes, and archives with optional
          password protection, download limits, and automatic expiration. No
          accounts required for recipients.
        </p>
      </section>

      {/* Main Hub: Upload & Receive */}
      <section
        aria-label="Transfer hub"
        className="grid gap-6 lg:grid-cols-12 items-start"
      >
        <div className="lg:col-span-7">
          <UploadZone />
        </div>
        <div className="lg:col-span-5">
          <ReceiveCode />
        </div>
      </section>

      {/* Value Pillars */}
      <section
        aria-label="Core capabilities"
        className="grid gap-4 sm:grid-cols-3 pt-4"
      >
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 sm:p-6 shadow-xs backdrop-blur-xs transition-colors hover:border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 text-primary mb-4 border border-border/40">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-sm font-semibold text-foreground">
            Controlled Access
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Secure sensitive transfers with password protection, configurable
            expiration from 1 hour to 30 days, or atomic single-use burn limits.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 sm:p-6 shadow-xs backdrop-blur-xs transition-colors hover:border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 text-primary mb-4 border border-border/40">
            <Zap className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-sm font-semibold text-foreground">
            Direct &amp; Seamless
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Drag-and-drop any file up to 10 MB, paste images directly from your
            clipboard, or share formatted code with instant language detection.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 sm:p-6 shadow-xs backdrop-blur-xs transition-colors hover:border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 text-primary mb-4 border border-border/40">
            <Clock className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-sm font-semibold text-foreground">
            Ephemeral by Design
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Zero permanent footprint. Shares automatically expire based on your
            chosen lifespan or download threshold, leaving no residue.
          </p>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section
        aria-label="Frequently asked questions"
        className="space-y-6 pt-4"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            <span>Specifications &amp; FAQ</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-muted-foreground">
            Technical answers on expiration, limits, security, and device
            clipboard synchronization.
          </p>
        </div>

        <div className="mx-auto max-w-3xl space-y-3 pt-2">
          {FAQS.map((faq, index) => (
            <details
              key={index}
              className="group rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-5 transition-all open:bg-card open:border-border/80 hover:border-border/80"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg py-1 [&::-webkit-details-marker]:hidden">
                <span className="pr-4">{faq.question}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground border-t border-border/40 pt-3">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
