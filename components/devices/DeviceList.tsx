"use client";
import { useState, useSyncExternalStore } from "react";
import { DeviceCard } from "./DeviceCard";
import { getCurrentClientId } from "@/lib/deviceClient";
import type { DeviceSummary } from "@/app/dashboard/devices/page";

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
      <div className="rounded-xl border border-dashed p-16 text-center">
        <p className="text-muted-foreground">No devices registered yet</p>
      </div>
    );
  }

  return (
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
  );
}
