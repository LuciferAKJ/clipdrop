import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { DeviceList } from "@/components/devices/DeviceList";
import Link from "next/link";
import { ArrowLeft, Radio } from "lucide-react";

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
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="space-y-4 border-b border-border/80 pb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 rounded-md py-1 px-1.5 -ml-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Uploads</span>
        </Link>
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/50 px-2.5 py-0.5 text-[11px] font-mono font-medium text-muted-foreground">
            <Radio className="h-3 w-3 text-brand-400" />
            <span>Active Sync Mesh</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-400 to-indigo-300">
              Devices
            </span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground max-w-lg">
            Manage paired browser sessions and trusted devices registered for
            seamless clipboard synchronization across your personal mesh.
          </p>
        </div>
      </div>

      <DeviceList initialDevices={summaries} />
    </main>
  );
}
