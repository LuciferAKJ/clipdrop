// components/share/LazyTextViewer.tsx (new)
"use client";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const LazyTextViewer = dynamic(
  () => import("./TextViewer").then((mod) => ({ default: mod.TextViewer })),
  {
    loading: () => <Skeleton className="h-32 w-full rounded-lg" />,
    ssr: false, // relies on navigator.clipboard in the Copy button; no SSR benefit for this component
  },
);
