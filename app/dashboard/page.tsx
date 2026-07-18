import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { DashboardList } from "@/components/dashboard/DashboardList";

export interface ShareSummary {
  id: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  downloadCount: number;
  oneTimeUse: boolean;
  fileCount: number;
  hasText: boolean;
  isExpired: boolean;
}

export default async function DashboardPage() {
  const { userId } = await auth.protect();

  const shares = await prisma.share.findMany({
    where: { userId },
    include: { files: true },
    orderBy: { createdAt: "desc" },
  });

  const summaries: ShareSummary[] = shares.map((s) => ({
    id: s.id,
    code: s.code,
    createdAt: s.createdAt.toISOString(),
    expiresAt: s.expiresAt.toISOString(),
    downloadCount: s.downloadCount,
    oneTimeUse: s.oneTimeUse,
    fileCount: s.files.length,
    hasText: !!s.textContent,
    isExpired: s.expiresAt < new Date(),
  }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold mb-1">My Uploads</h1>
      <p className="text-muted-foreground mb-8">
        Everything you&apos;ve shared while signed in.
      </p>
      <DashboardList initialShares={summaries} />
    </main>
  );
}