"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Menu, X, ArrowUpRight, Radio } from "lucide-react";
import { useClipboardSyncStatus } from "@/hooks/useClipboardSyncStatus";

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const syncStatus = useClipboardSyncStatus();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [mobileMenuOpen]);

  const isHome = pathname === "/";
  const isDashboard = pathname === "/dashboard";
  const isDevices = pathname === "/dashboard/devices";

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30 transition-transform group-hover:scale-105">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v10" />
              <path d="m7 7 5 5 5-5" />
              <rect width="20" height="8" x="2" y="14" rx="2" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-heading text-base font-bold tracking-tight text-foreground">
              ClipDrop
            </span>
            <span className="hidden sm:inline-flex rounded-full border border-border/80 bg-secondary/50 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              transit
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-1"
          aria-label="Main Navigation"
        >
          <Link
            href="/"
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              isHome
                ? "bg-secondary text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            Home
          </Link>

          <Show when="signed-in">
            <Link
              href="/dashboard"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isDashboard
                  ? "bg-secondary text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              Dashboard
            </Link>

            <Link
              href="/dashboard/devices"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isDevices
                  ? "bg-secondary text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              Devices
            </Link>
          </Show>
        </nav>

        {/* Right Section: Sync Status & Auth */}
        <div className="flex items-center gap-3">
          <Show when="signed-in">
            {/* Clipboard sync status indicator */}
            <div
              className="hidden sm:flex items-center gap-2 rounded-full border border-border/80 bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground"
              title={
                syncStatus.status === "syncing" ||
                syncStatus.status === "pushing" ||
                syncStatus.status === "pulling"
                  ? "Syncing clipboard..."
                  : syncStatus.status === "error"
                    ? "Sync error"
                    : "Clipboard sync active"
              }
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  syncStatus.status === "syncing" ||
                  syncStatus.status === "pushing" ||
                  syncStatus.status === "pulling"
                    ? "bg-primary animate-pulse"
                    : syncStatus.status === "error"
                      ? "bg-destructive"
                      : "bg-emerald-400"
                }`}
              />
              <span className="font-mono text-[11px] font-medium capitalize">
                {syncStatus.status === "idle"
                  ? "sync active"
                  : syncStatus.status}
              </span>
            </div>

            <div className="flex items-center">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox:
                      "h-8 w-8 ring-1 ring-border/80 rounded-full",
                  },
                }}
              />
            </div>
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="inline-flex h-8.5 min-h-[34px] items-center justify-center rounded-lg border border-border/80 bg-card/80 px-3 text-xs font-medium text-foreground transition-all hover:bg-secondary hover:border-border active:scale-[0.985]">
                Sign In
              </button>
            </SignInButton>
          </Show>

          {/* Mobile Menu Toggle Button (44px min touch target) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation & Backdrop */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-16 z-40 bg-black/70 backdrop-blur-xs md:hidden animate-in fade-in duration-150"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-50 border-t border-border/80 bg-background/95 px-4 py-4 backdrop-blur-2xl md:hidden animate-in slide-in-from-top-2 duration-150 shadow-xl shadow-black/50">
            <nav
              className="flex flex-col gap-1.5"
              aria-label="Mobile Navigation"
            >
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex h-11 items-center justify-between rounded-xl px-4 text-xs font-medium transition-colors ${
                  isHome
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <span>Home</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
              </Link>

              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex h-11 items-center justify-between rounded-xl px-4 text-xs font-medium transition-colors ${
                    isDashboard
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <span>Dashboard</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
                </Link>

                <Link
                  href="/dashboard/devices"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex h-11 items-center justify-between rounded-xl px-4 text-xs font-medium transition-colors ${
                    isDevices
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <span>Devices</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
                </Link>

                <div className="mt-2 flex items-center justify-between border-t border-border/70 pt-3 px-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Radio className="h-3 w-3 text-muted-foreground" />
                    Sync status
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        syncStatus.status === "error"
                          ? "bg-destructive"
                          : syncStatus.status === "idle"
                            ? "bg-emerald-400"
                            : "bg-primary animate-pulse"
                      }`}
                    />
                    <span className="text-[11px] font-medium capitalize text-foreground">
                      {syncStatus.status}
                    </span>
                  </div>
                </div>
              </Show>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
