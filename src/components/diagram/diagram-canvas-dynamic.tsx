"use client";

/**
 * Dynamic Diagram Canvas Import
 * Prevents SSR issues with canvas rendering
 */

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const DiagramCanvasDynamic = dynamic(
  () => import("./diagram-canvas").then((mod) => mod.DiagramCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        </div>
      </div>
    ),
  }
);
