import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { DashboardList } from "@/components/dashboard/DashboardList";
import Link from "next/link";
import { Laptop, Plus, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Uploads",
  robots: {
    index: false,
    follow: false,
  },
};

export interface ShareSummary {
  id: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  downloadCount: number;
  downloadLimit: number | null;
  fileCount: number;
  hasText: boolean;
  isExpired: boolean;
}

export default async function DashboardPage() {
  const { userId } = await auth.protect();

  const shares = await prisma.share.findMany({
    where: { userId },
    include: { files: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  const summaries: ShareSummary[] = shares.map((s) => ({
    id: s.id,
    code: s.code,
    createdAt: s.createdAt.toISOString(),
    expiresAt: s.expiresAt.toISOString(),
    downloadCount: s.downloadCount,
    downloadLimit: s.downloadLimit,
    fileCount: s.files.length,
    hasText: !s.textContent,
    isExpired:
      s.expiresAt < now ||
      Boolean(s.consumedAt) ||
      (s.downloadLimit !== null && s.downloadCount >= s.downloadLimit),
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 space-y-8 animate-in fade-in duration-200">
      {/* Workspace Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/50 px-2.5 py-0.5 text-[11px] font-mono font-medium text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-brand-400" />
            <span>Authenticated Workspace</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-400 to-indigo-300">
              Uploads
            </span>
          </h1>
          <p className="text-xs text-muted-foreground max-w-md">
            Monitor active transit codes, copy recipient links, and manage
            automated expiration lifecycles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/devices"
            className="inline-flex h-10 min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-semibold text-foreground transition-all hover:bg-secondary hover:border-border/80 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
          >
            <Laptop className="h-4 w-4 text-muted-foreground" />
            <span>Devices</span>
          </Link>

          <Link
            href="/"
            className="inline-flex h-10 min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-xs font-semibold text-white shadow-sm shadow-brand-500/20 transition-all hover:bg-brand-500/90 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
          >
            <Plus className="h-4 w-4" />
            <span>New Share</span>
          </Link>
        </div>
      </div>

      {/* Dynamic List with single source of truth KPI cards */}
      <DashboardList initialShares={summaries} />
    </main>
  );
}
