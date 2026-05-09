import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface LoadingSkeletonProps {
  type: "table" | "card" | "list" | "stat"
}

export function LoadingSkeleton({ type }: LoadingSkeletonProps) {
  if (type === "table") {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (type === "card") {
    return (
      <div className="flex flex-col space-y-3 border p-5 rounded-xl bg-white shadow-sm">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
      </div>
    )
  }

  if (type === "stat") {
    return (
      <div className="flex flex-col space-y-3 border p-5 rounded-xl bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
        <Skeleton className="h-4 w-[120px]" />
      </div>
    )
  }

  if (type === "list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-3 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return null
}
