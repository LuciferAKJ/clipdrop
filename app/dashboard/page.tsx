import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { DashboardList } from "@/components/dashboard/DashboardList";
import Link from "next/link";
import { Laptop, Plus } from "lucide-react";

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
    hasText: !!s.textContent,
    isExpired: s.expiresAt < now,
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-14 space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Workspace
          </span>
          <h1 className="mt-1 font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Uploads
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Monitor, copy, and manage your active and expired shares.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/devices"
            className="inline-flex h-10 min-h-[40px] items-center justify-center gap-2 rounded-xl border border-border bg-card px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary active:scale-[0.98]"
          >
            <Laptop className="h-4 w-4 text-muted-foreground" />
            <span>Devices</span>
          </Link>

          <Link
            href="/"
            className="inline-flex h-10 min-h-[40px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
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
