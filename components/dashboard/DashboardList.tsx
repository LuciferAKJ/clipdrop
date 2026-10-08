"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ShareCard } from "./ShareCard";
import type { ShareSummary } from "@/app/dashboard/page";
import {
  Activity,
  Clock,
  Download,
  Files,
  Search,
  Plus,
  X,
  ArrowUpRight,
} from "lucide-react";
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
      <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-10 sm:p-16 text-center space-y-4 shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/80 text-muted-foreground border border-border/60">
          <Files className="h-6 w-6" />
        </div>
        <div className="space-y-1.5 max-w-sm mx-auto">
          <h2 className="font-heading text-base font-bold text-foreground">
            No active or past uploads
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Shares and temporary links created while signed in will appear here
            with live download metrics and expiration controls.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex h-10 min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-xs font-semibold text-white shadow-sm shadow-brand-500/25 transition-all hover:bg-brand-500/90 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
          >
            <Plus className="h-4 w-4" />
            <span>Create a Share</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Stats Strip */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
        {/* Total Shares */}
        <div className="rounded-2xl border border-border/80 bg-card/90 p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Shares</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/70 text-muted-foreground border border-border/60">
              <Files className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
            {totalShares}
          </p>
        </div>

        {/* Active Shares */}
        <div className="rounded-2xl border border-border/80 bg-card/90 p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Active</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tracking-tight">
            {activeShares}
          </p>
        </div>

        {/* Expired Shares */}
        <div className="rounded-2xl border border-border/80 bg-card/90 p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Expired / Consumed</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/70 text-muted-foreground border border-border/60">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-muted-foreground tracking-tight">
            {expiredShares}
          </p>
        </div>

        {/* Total Downloads */}
        <div className="rounded-2xl border border-border/80 bg-card/90 p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Downloads</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Download className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
            {totalDownloads}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by 6-digit code..."
            aria-label="Search shares by code"
            className="pl-9.5 pr-8 h-10 min-h-[44px] text-xs font-mono rounded-xl bg-card/80 border-border/80"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Clear search input"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Segmented Filter Pills */}
        <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl border border-border/60 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filter === "all"
                ? "bg-card text-foreground font-semibold shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            All{" "}
            <span className="font-mono text-[11px] opacity-70">
              ({totalShares})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("active")}
            className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filter === "active"
                ? "bg-card text-emerald-400 font-semibold shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            Active{" "}
            <span className="font-mono text-[11px] opacity-70">
              ({activeShares})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("expired")}
            className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filter === "expired"
                ? "bg-card text-foreground font-semibold shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            Expired{" "}
            <span className="font-mono text-[11px] opacity-70">
              ({expiredShares})
            </span>
          </button>
        </div>
      </div>

      {/* Share Cards Grid */}
      {filteredShares.length > 0 ? (
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredShares.map((share) => (
            <ShareCard key={share.id} share={share} onDeleted={handleDeleted} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-card/40 p-8 sm:p-10 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 text-muted-foreground">
            <Search className="h-5 w-5" />
          </div>
          <p className="text-xs text-muted-foreground">
            No shares match your current query or filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
          >
            <span>Reset filters</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
