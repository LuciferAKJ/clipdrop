"use client";
import { useState } from "react";
import Link from "next/link";
import { ShareCard } from "./ShareCard";
import type { ShareSummary } from "@/app/dashboard/page";

export function DashboardList({ initialShares }: { initialShares: ShareSummary[] }) {
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

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shares.map((share) => (
        <ShareCard key={share.id} share={share} onDeleted={handleDeleted} />
      ))}
    </div>
  );
}