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
  Clock3,
  Copy,
  Download,
  ExternalLink,
  File,
  FileText,
  Trash2,
} from "lucide-react";
import type { ShareSummary } from "@/app/dashboard/page";

function Badge({ expired }: { expired: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        expired
          ? "bg-destructive/15 text-destructive"
          : "bg-emerald-500/15 text-emerald-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          expired ? "bg-destructive" : "bg-emerald-500"
        }`}
      />
      {expired ? "Expired" : "Active"}
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
      share.hasText ? "Text" : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Empty";

  return (
    <div className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Share code
          </p>

          <p className="mt-1 truncate font-mono text-xl font-bold tracking-wider">
            {share.code}
          </p>
        </div>

        <Badge expired={share.isExpired} />
      </div>

      {/* Metadata */}
      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <File className="h-4 w-4" />
            Content
          </span>

          <span className="max-w-[55%] truncate text-right font-medium">
            {contentDisplay}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Download className="h-4 w-4" />
            Downloads
          </span>

          <span className="font-medium">{downloadDisplay}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Clock3 className="h-4 w-4" />
            Expires
          </span>

          <span className="font-medium">{relativeTime(share.expiresAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" onClick={copyLink} className="h-9">
          {copied ? (
            <Check className="mr-1.5 h-4 w-4" />
          ) : (
            <Copy className="mr-1.5 h-4 w-4" />
          )}

          {copied ? "Copied" : "Copy Link"}
        </Button>

        <a
          href={shareHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          Open
        </a>
      </div>

      {/* Delete */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
        className="mt-2 h-9 w-full text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="mr-1.5 h-4 w-4" />
        Delete Share
      </Button>

      {/* Confirmation dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this share?</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            This permanently deletes code <strong>{share.code}</strong> and any
            attached files. This cannot be undone.
          </p>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
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
