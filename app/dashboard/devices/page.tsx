import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { DeviceList } from "@/components/devices/DeviceList";

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
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold mb-1">My Devices</h1>
      <p className="text-muted-foreground mb-8">
        Devices registered to your account.
      </p>
      <DeviceList initialDevices={summaries} />
    </main>
  );
}