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
import { getCurrentClientId } from "@/lib/deviceClient";
import type { DeviceSummary } from "@/app/dashboard/devices/page";

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
    <div className="rounded-xl border p-4 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setNameInput(device.name);
                  setEditing(false);
                }
              }}
            />
            <Button size="sm" onClick={handleRename} disabled={saving}>
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
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{primary}</p>
            {isCurrent && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 shrink-0">
                Current Device
              </span>
            )}
          </div>
        )}
        {secondary && !editing && (
          <p className="text-sm text-muted-foreground">{secondary}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Registered {new Date(device.registeredAt).toLocaleDateString()} · Last seen{" "}
          {new Date(device.lastSeenAt).toLocaleString()}
        </p>
      </div>

      {!editing && (
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Rename
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
            disabled={isCurrent}
            title={isCurrent ? "Can't remove the device you're currently using" : undefined}
          >
            Remove
          </Button>
        </div>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this device?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{primary}</strong> will no longer be registered to your account.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}