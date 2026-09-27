"use client";
import { useState } from "react";
import { toast } from "sonner";
import { withClientIdHeader } from "@/lib/deviceClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { splitDeviceLabel } from "@/lib/deviceDisplay";
import type { DeviceSummary } from "@/app/dashboard/devices/page";
import { Laptop, Smartphone, Monitor, Clock } from "lucide-react";

function DeviceIcon({
  name,
  className = "h-5 w-5",
}: {
  name: string;
  className?: string;
}) {
  const lower = name.toLowerCase();
  if (
    lower.includes("iphone") ||
    lower.includes("android") ||
    lower.includes("mobile")
  ) {
    return <Smartphone className={className} />;
  }
  if (
    lower.includes("mac") ||
    lower.includes("apple") ||
    lower.includes("laptop")
  ) {
    return <Laptop className={className} />;
  }
  return <Monitor className={className} />;
}

export function DeviceCard({
  device,
  isCurrent,
  onRenamed,
  onDeleted,
}: {
  device: DeviceSummary;
  isCurrent: boolean;
  onRenamed: (id: string, name: string) => void;
  onDeleted: (id: string) => void;
}) {
  const { primary, secondary } = splitDeviceLabel(device.name);

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(device.name);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleRename() {
    if (!nameInput.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/devices/${device.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Rename failed");

      onRenamed(device.id, nameInput.trim());
      toast.success("Device renamed");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rename failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/devices/${device.id}`, {
        method: "DELETE",
        headers: withClientIdHeader(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");

      onDeleted(device.id);
      toast.success("Device removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-primary/30">
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <DeviceIcon name={device.name} />
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="h-9 text-xs max-w-xs"
                autoFocus
                aria-label="Device name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") {
                    setNameInput(device.name);
                    setEditing(false);
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleRename}
                disabled={saving}
                className="h-9 text-xs"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setNameInput(device.name);
                  setEditing(false);
                }}
                disabled={saving}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-heading font-semibold text-sm text-foreground truncate">
                  {primary}
                </p>
                {isCurrent && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shrink-0">
                    Current Device
                  </span>
                )}
              </div>

              {secondary && (
                <p className="text-xs text-muted-foreground truncate">
                  {secondary}
                </p>
              )}

              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5 font-mono">
                <Clock className="h-3 w-3" />
                <span>
                  Registered{" "}
                  {new Date(device.registeredAt).toLocaleDateString()} · Last
                  seen{" "}
                  {new Date(device.lastSeenAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {!editing && (
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(true)}
            className="h-8.5 text-xs px-3"
          >
            Rename
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
            disabled={isCurrent}
            className="h-8.5 text-xs px-3"
            title={
              isCurrent
                ? "Can't remove the device you're currently using"
                : undefined
            }
          >
            Remove
          </Button>
        </div>
      )}

      {/* Confirmation Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent aria-describedby="delete-device-description">
          <DialogHeader>
            <DialogTitle>Remove this device?</DialogTitle>
          </DialogHeader>
          <p
            id="delete-device-description"
            className="text-xs text-muted-foreground leading-relaxed"
          >
            <strong className="text-foreground">{primary}</strong> will no
            longer be registered to your account for clipboard syncing.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteOpen(false)}
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
              {deleting ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
