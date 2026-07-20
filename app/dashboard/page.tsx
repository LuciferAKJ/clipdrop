import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { DashboardList } from "@/components/dashboard/DashboardList";
import Link from "next/link";

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
  const { userId } = await auth.protect(); // redirects to Clerk Sign In if unauthenticated

  const shares = await prisma.share.findMany({
    where: { userId },
    include: { files: true }, // single query, no N+1
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  const summaries: ShareSummary[] = shares.map((s) => ({
    id: s.id,
    code: s.code,
    createdAt: s.createdAt.toISOString(),
    expiresAt: s.expiresAt.toISOString(),
    downloadCount: s.downloadCount,
    oneTimeUse: s.oneTimeUse,
    fileCount: s.files.length,
    hasText: !!s.textContent,
    isExpired: s.expiresAt < now,
  }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Uploads</h1>

        <Link
          href="/dashboard/devices"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          My Devices →
        </Link>
      </div>

      <p className="mb-8 text-muted-foreground">
        Everything you&apos;ve shared while signed in.
      </p>

      <DashboardList initialShares={summaries} />
    </main>
  );
}
