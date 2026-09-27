import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { DeviceList } from "@/components/devices/DeviceList";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Devices",
  robots: {
    index: false,
    follow: false,
  },
};

export interface DeviceSummary {
  id: string;
  clientId: string;
  name: string;
  registeredAt: string;
  lastSeenAt: string;
}

export default async function DevicesPage() {
  const { userId } = await auth.protect();

  const devices = await prisma.device.findMany({
    where: { userId },
    orderBy: { lastSeenAt: "desc" },
  });

  const summaries: DeviceSummary[] = devices.map((d) => ({
    id: d.id,
    clientId: d.clientId,
    name: d.name,
    registeredAt: d.registeredAt.toISOString(),
    lastSeenAt: d.lastSeenAt.toISOString(),
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-14 space-y-8">
      {/* Header */}
      <div className="space-y-3 border-b border-border/80 pb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Uploads</span>
        </Link>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Workspace
          </span>
          <h1 className="mt-1 font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Devices
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage browser sessions and devices registered for automatic
            clipboard transit.
          </p>
        </div>
      </div>

      <DeviceList initialDevices={summaries} />
    </main>
  );
}
