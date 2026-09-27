"use client";
import { useState, useSyncExternalStore } from "react";
import { DeviceCard } from "./DeviceCard";
import { getCurrentClientId } from "@/lib/deviceClient";
import type { DeviceSummary } from "@/app/dashboard/devices/page";
import { Laptop } from "lucide-react";

function subscribeNoop() {
  return () => {};
}

function getClientIdSnapshot() {
  return getCurrentClientId();
}

function getClientIdServerSnapshot() {
  return null;
}

export function DeviceList({
  initialDevices,
}: {
  initialDevices: DeviceSummary[];
}) {
  const [devices, setDevices] = useState(initialDevices);
  const currentClientId = useSyncExternalStore(
    subscribeNoop,
    getClientIdSnapshot,
    getClientIdServerSnapshot,
  );

  function handleRenamed(id: string, name: string) {
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, name } : d)));
  }

  function handleDeleted(id: string) {
    setDevices((prev) => prev.filter((d) => d.id !== id));
  }

  if (devices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 sm:p-16 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          <Laptop className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          No devices registered yet
        </p>
        <p className="text-xs text-muted-foreground">
          Sign in from any browser to register it for instant clipboard syncing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            isCurrent={device.clientId === currentClientId}
            onRenamed={handleRenamed}
            onDeleted={handleDeleted}
          />
        ))}
      </div>
    </div>
  );
}
