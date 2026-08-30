import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { DashboardList } from "@/components/dashboard/DashboardList";
import Link from "next/link";
import { Activity, Clock3, Download, Files, Plus } from "lucide-react";

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

  const totalShares = summaries.length;
  const activeShares = summaries.filter((share) => !share.isExpired).length;
  const expiredShares = summaries.filter((share) => share.isExpired).length;
  const totalDownloads = summaries.reduce(
    (total, share) => total + share.downloadCount,
    0,
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">
            Your workspace
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            My Uploads
          </h1>

          <p className="mt-2 max-w-xl text-muted-foreground">
            Manage your shared files and text from one place.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/dashboard/devices"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Devices
          </Link>

          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Share
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total shares</p>
            <Files className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-3 text-2xl font-bold">{totalShares}</p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Active</p>
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>

          <p className="mt-3 text-2xl font-bold">{activeShares}</p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Expired</p>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-3 text-2xl font-bold">{expiredShares}</p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Downloads</p>
            <Download className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-3 text-2xl font-bold">{totalDownloads}</p>
        </div>
      </div>

      {/* Shares */}
      <div className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Your shares</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your most recent shares appear first.
            </p>
          </div>
        </div>

        <DashboardList initialShares={summaries} />
      </div>
    </main>
  );
}
