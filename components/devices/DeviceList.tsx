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
      <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-10 sm:p-16 text-center space-y-3 shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/80 text-muted-foreground border border-border/60">
          <Laptop className="h-6 w-6" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h2 className="font-heading text-base font-bold text-foreground">
            No devices registered yet
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sign in from any desktop or mobile browser to automatically register
            it for instant background clipboard sync.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
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
  );
}
