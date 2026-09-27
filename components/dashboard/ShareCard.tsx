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
  FileText,
  Trash2,
} from "lucide-react";
import type { ShareSummary } from "@/app/dashboard/page";

function Badge({ expired }: { expired: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        expired
          ? "bg-destructive/15 text-destructive"
          : "bg-emerald-500/15 text-emerald-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          expired ? "bg-destructive" : "bg-emerald-400"
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
    toast.success("Link copied");
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

      toast.success("Share deleted");
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
      : `${share.downloadCount} · Unlimited`;

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

  return (
    <div className="group rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Code
            </span>
            <p className="mt-0.5 truncate font-mono text-xl font-bold tracking-wider text-foreground">
              {share.code}
            </p>
          </div>

          <Badge expired={share.isExpired} />
        </div>

        {/* Metadata Details */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
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
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${percentUsed}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Expires</span>
            </span>
            <span className="font-medium text-foreground">
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
            className="h-9 text-xs"
          >
            {copied ? (
              <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="mr-1.5 h-3.5 w-3.5" />
            )}
            <span>{copied ? "Copied" : "Copy Link"}</span>
          </Button>

          <a
            href={shareHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary active:scale-[0.98]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open</span>
          </a>
        </div>

        {/* Delete Trigger */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setOpen(true)}
          className="h-8 w-full text-xs text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          <span>Delete Share</span>
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this share?</DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground leading-relaxed">
            This permanently removes share code{" "}
            <strong className="font-mono text-foreground">{share.code}</strong>{" "}
            and any attached files. This action cannot be undone.
          </p>

          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
