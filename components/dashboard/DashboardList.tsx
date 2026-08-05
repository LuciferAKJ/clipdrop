"use client";
import { useState } from "react";
import Link from "next/link";
import { ShareCard } from "./ShareCard";
import type { ShareSummary } from "@/app/dashboard/page";

export function DashboardList({
  initialShares,
}: {
  initialShares: ShareSummary[];
}) {
  const [shares, setShares] = useState(initialShares);

  function handleDeleted(id: string) {
    setShares((prev) => prev.filter((s) => s.id !== id));
  }

  if (shares.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-16 text-center space-y-4">
        <p className="text-muted-foreground">No uploads yet</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Create a share
        </Link>
      </div>
    );
  }

  const totalShares = shares.length;
  const activeShares = shares.filter((s) => !s.isExpired).length;
  const expiredShares = shares.filter((s) => s.isExpired).length;
  const totalDownloads = shares.reduce((sum, s) => sum + s.downloadCount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Total Shares</p>
          <p className="mt-2 text-3xl font-bold">{totalShares}</p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="mt-2 text-3xl font-bold text-emerald-500">
            {activeShares}
          </p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Expired</p>
          <p className="mt-2 text-3xl font-bold text-red-500">
            {expiredShares}
          </p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-muted-foreground">Downloads</p>
          <p className="mt-2 text-3xl font-bold">{totalDownloads}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shares.map((share) => (
          <ShareCard key={share.id} share={share} onDeleted={handleDeleted} />
        ))}
      </div>
    </div>
  );
}
