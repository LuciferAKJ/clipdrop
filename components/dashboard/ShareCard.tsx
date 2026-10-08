"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Check,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Trash2,
  Layers,
} from "lucide-react";
import type { ShareSummary } from "@/app/dashboard/page";

function StatusBadge({ expired }: { expired: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border ${
        expired
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          expired ? "bg-destructive" : "bg-emerald-400 animate-pulse"
        }`}
      />
      <span>{expired ? "Expired" : "Active"}</span>
    </span>
  );
}

function relativeTime(date: string) {
  const diff = new Date(date).getTime() - Date.now();
  const abs = Math.abs(diff);

  const minutes = Math.floor(abs / 60000);
  const hours = Math.floor(abs / 3600000);
  const days = Math.floor(abs / 86400000);

  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? "" : "s"} ${
      diff > 0 ? "left" : "ago"
    }`;
  }

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ${
      diff > 0 ? "left" : "ago"
    }`;
  }

  return `${days} day${days === 1 ? "" : "s"} ${diff > 0 ? "left" : "ago"}`;
}

export function ShareCard({
  share,
  onDeleted,
}: {
  share: ShareSummary;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareHref = `/s/${share.code}`;

  function copyLink() {
    if (typeof window === "undefined") return;

    navigator.clipboard.writeText(`${window.location.origin}${shareHref}`);
    toast.success("Link copied to clipboard");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    setDeleting(true);

    try {
      const res = await fetch("/api/dashboard/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shareId: share.id,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Delete failed");
      }

      toast.success("Share deleted successfully");
      onDeleted(share.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  }

  const downloadDisplay =
    share.downloadLimit !== null && share.downloadLimit !== undefined
      ? `${share.downloadCount} / ${share.downloadLimit}`
      : `${share.downloadCount} (Unlimited)`;

  const contentDisplay =
    [
      share.fileCount > 0
        ? `${share.fileCount} file${share.fileCount !== 1 ? "s" : ""}`
        : null,
      share.hasText ? "Text note" : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Empty";

  const percentUsed =
    share.downloadLimit && share.downloadLimit > 0
      ? Math.min(
          100,
          Math.round((share.downloadCount / share.downloadLimit) * 100),
        )
      : null;

  const isUnavailable =
    share.isExpired ||
    (share.downloadLimit !== null &&
      share.downloadLimit !== undefined &&
      share.downloadCount >= share.downloadLimit);

  return (
    <div className="group rounded-2xl border border-border/80 bg-card/90 p-5 shadow-xs transition-all hover:border-brand-500/40 hover:shadow-md flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              Transit Code
            </span>
            <p className="mt-0.5 truncate font-mono text-xl font-bold tracking-widest text-foreground">
              {share.code}
            </p>
          </div>

          <StatusBadge expired={isUnavailable} />
        </div>

        {/* Metadata Details */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              <span>Content</span>
            </span>
            <span className="font-medium text-foreground truncate max-w-[60%] text-right">
              {contentDisplay}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Download className="h-3.5 w-3.5" />
              <span>Downloads</span>
            </span>
            <span className="font-mono font-medium text-foreground">
              {downloadDisplay}
            </span>
          </div>

          {percentUsed !== null && (
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${percentUsed}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Expires</span>
            </span>
            <span className="font-medium text-foreground font-mono text-[11px]">
              {relativeTime(share.expiresAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="mt-6 pt-4 border-t border-border/60 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copyLink}
            className="h-9 min-h-[38px] min-w-0 px-2 sm:px-3 text-xs rounded-xl"
            aria-label={`Copy share link for code ${share.code}`}
          >
            {copied ? (
              <Check className="mr-1.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
            ) : (
              <Copy className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate">{copied ? "Copied" : "Copy Link"}</span>
          </Button>

          {isUnavailable ? (
            <button
              type="button"
              disabled
              className="inline-flex h-9 min-h-[38px] min-w-0 items-center justify-center gap-1.5 rounded-xl border border-border/40 bg-secondary/30 px-2 sm:px-3 text-xs font-semibold text-muted-foreground/50 cursor-not-allowed select-none"
              title="This share is expired or consumed and can no longer be accessed"
            >
              <ExternalLink
                className="h-3.5 w-3.5 shrink-0 opacity-40"
                aria-hidden="true"
              />
              <span className="truncate">Unavailable</span>
            </button>
          ) : (
            <a
              href={shareHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open share ${share.code} in new tab`}
              className="inline-flex h-9 min-h-[38px] min-w-0 items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-card px-2 sm:px-3 text-xs font-semibold text-foreground transition-all hover:bg-secondary hover:border-border active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
            >
              <ExternalLink
                className="h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">Open</span>
              <span className="sr-only">(opens in new tab)</span>
            </a>
          )}
        </div>

        {/* Delete Trigger */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setOpen(true)}
          className="h-8.5 min-h-[36px] w-full text-xs text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors rounded-xl"
          aria-label={`Delete share code ${share.code}`}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          <span>Delete Share</span>
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby="delete-share-description">
          <DialogHeader>
            <DialogTitle>Delete this share?</DialogTitle>
          </DialogHeader>

          <p
            id="delete-share-description"
            className="text-xs text-muted-foreground leading-relaxed"
          >
            This permanently removes transit code{" "}
            <strong className="font-mono text-foreground">{share.code}</strong>{" "}
            and deletes any attached files from cloud storage. This action
            cannot be undone.
          </p>

          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={deleting}
              className="rounded-xl min-h-[38px]"
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl min-h-[38px]"
            >
              {deleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
