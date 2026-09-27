"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { ShareCard } from "./ShareCard";
import type { ShareSummary } from "@/app/dashboard/page";
import { Activity, Clock, Download, Files, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

export function DashboardList({
  initialShares,
}: {
  initialShares: ShareSummary[];
}) {
  const [shares, setShares] = useState(initialShares);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");

  function handleDeleted(id: string) {
    setShares((prev) => prev.filter((s) => s.id !== id));
  }

  const totalShares = shares.length;
  const activeShares = shares.filter((s) => !s.isExpired).length;
  const expiredShares = shares.filter((s) => s.isExpired).length;
  const totalDownloads = shares.reduce((sum, s) => sum + s.downloadCount, 0);

  const filteredShares = useMemo(() => {
    return shares.filter((s) => {
      const matchesSearch =
        search.trim() === "" ||
        s.code.toLowerCase().includes(search.trim().toLowerCase());
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "active"
            ? !s.isExpired
            : s.isExpired;
      return matchesSearch && matchesFilter;
    });
  }, [shares, search, filter]);

  if (shares.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 sm:p-16 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          <Files className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-base font-semibold text-foreground">
            No uploads yet
          </h2>
          <p className="text-xs text-muted-foreground">
            Shares you create while signed in will appear in your workspace.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs shadow-primary/20 transition-all hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Create a share
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Stats Strip */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Shares</span>
            <Files className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-foreground">
            {totalShares}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Active</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
            {activeShares}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Expired</span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-muted-foreground">
            {expiredShares}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Downloads</span>
            <Download className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-foreground">
            {totalDownloads}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code..."
            className="pl-9.5 h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl border border-border/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filter === "all"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({totalShares})
          </button>
          <button
            type="button"
            onClick={() => setFilter("active")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filter === "active"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active ({activeShares})
          </button>
          <button
            type="button"
            onClick={() => setFilter("expired")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filter === "expired"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Expired ({expiredShares})
          </button>
        </div>
      </div>

      {/* Share Cards Grid */}
      {filteredShares.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredShares.map((share) => (
            <ShareCard key={share.id} share={share} onDeleted={handleDeleted} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-card/40 p-8 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            No shares match your current search or filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
