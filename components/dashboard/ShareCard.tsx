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
import type { ShareSummary } from "@/app/dashboard/page";

function Badge({ expired }: { expired: boolean }) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        expired
          ? "bg-destructive/15 text-destructive"
          : "bg-emerald-500/15 text-emerald-500"
      }`}
    >
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

  if (minutes < 60)
    return `${minutes} min${minutes === 1 ? "" : "s"} ${diff > 0 ? "left" : "ago"}`;

  if (hours < 24)
    return `${hours} hour${hours === 1 ? "" : "s"} ${diff > 0 ? "left" : "ago"}`;

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
  const shareHref = `/s/${share.code}`;

  function copyLink() {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(`${window.location.origin}${shareHref}`);
    toast.success("Link copied");
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/dashboard/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId: share.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");

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
      : `${share.downloadCount} (Unlimited)`;

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
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono font-semibold tracking-wide text-lg">
          {share.code}
        </p>
        <Badge expired={share.isExpired} />
      </div>

      <div className="text-sm text-muted-foreground space-y-1">
        <p>📅 Created: {relativeTime(share.createdAt)}</p>
        <p>⏳ Expires: {relativeTime(share.expiresAt)}</p>
        <p>⬇ Downloads: {downloadDisplay}</p>
        <p>📄 Content: {contentDisplay}</p>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          onClick={copyLink}
          className="flex-1"
        >
          Copy Link
        </Button>
        <a
          href={shareHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Open
        </a>

        <Button size="sm" variant="destructive" onClick={() => setOpen(true)}>
          Delete
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this share?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This permanently deletes code <strong>{share.code}</strong> and
              any attached files. This cannot be undone.
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
    </div>
  );
}
