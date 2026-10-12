"use client"

import * as React from "react"
import { Database, HardDrive, ShieldCheck, AlertTriangle, Layers } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { StorageQuotaInfo } from "@/types/storage.types"
import { Skeleton } from "@/components/ui/skeleton"

interface StorageMeterProps {
  quota: StorageQuotaInfo | undefined
  isLoading?: boolean
  title?: string
  description?: string
  compact?: boolean
  className?: string
  showBadge?: boolean
}

export function StorageMeter({
  quota,
  isLoading = false,
  title,
  description,
  compact = false,
  className,
  showBadge = true,
}: StorageMeterProps) {
  if (isLoading || !quota) {
    return (
      <div
        className={cn(
          "rounded-xl border border-slate-200 bg-white p-4 shadow-xs",
          compact ? "p-3" : "p-4.5",
          className
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full mb-2" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    )
  }

  const {
    realm,
    usedMB,
    quotaMB,
    availableMB,
    usagePercentage,
    isWarning,
    isCritical,
    isLimitExceeded,
    totalDocumentsCount,
  } = quota

  // Semantic color selection based on percentage thresholds
  const meterColor = isCritical || isLimitExceeded
    ? "bg-red-500"
    : isWarning
    ? "bg-amber-500"
    : "bg-blue-600"

  const badgeColor = isCritical || isLimitExceeded
    ? "bg-red-50 text-red-700 border-red-200"
    : isWarning
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-blue-50 text-blue-700 border-blue-200"

  const displayTitle =
    title ||
    (realm === "FACULTY"
      ? "Faculty Repository Quota"
      : "Dean / Admin Institutional Repository")

  if (compact) {
    return (
      <div
        className={cn(
          "rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 text-xs transition-all",
          className
        )}
      >
        <div className="flex items-center justify-between font-medium text-slate-700 mb-1.5">
          <span className="flex items-center gap-1.5 font-semibold text-slate-800">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            {displayTitle}
          </span>
          <span className="text-[11px] font-semibold text-slate-600">
            {usedMB} MB / {quotaMB} MB ({usagePercentage}%)
          </span>
        </div>
        <Progress
          value={usagePercentage}
          className="h-1.5 bg-slate-200"
          indicatorClassName={meterColor}
        />
        <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500">
          <span>{availableMB} MB remaining</span>
          <span className="inline-flex items-center gap-1 text-slate-400">
            <Layers className="w-2.5 h-2.5" /> Single-deduction active
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-sm",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border",
              isCritical
                ? "bg-red-50 border-red-200 text-red-600"
                : isWarning
                ? "bg-amber-50 border-amber-200 text-amber-600"
                : "bg-blue-50 border-blue-200 text-blue-600"
            )}
          >
            {realm === "FACULTY" ? (
              <HardDrive className="w-4.5 h-4.5" />
            ) : (
              <Database className="w-4.5 h-4.5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">
              {displayTitle}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {description ||
                (realm === "FACULTY"
                  ? `${totalDocumentsCount} exhibits mapped · Single-deduction exhibit engine`
                  : `${totalDocumentsCount} verified accreditation documents in central archive`)}
            </p>
          </div>
        </div>

        {showBadge && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border",
                badgeColor
              )}
            >
              {isCritical ? (
                <>
                  <AlertTriangle className="w-3 h-3" /> Critical Quota
                </>
              ) : isWarning ? (
                <>
                  <AlertTriangle className="w-3 h-3" /> Approaching Limit
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3 h-3" /> Normal Allocation
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">
            {usedMB} MB used <span className="text-slate-400 font-normal">of {quotaMB} MB</span>
          </span>
          <span className="font-bold text-slate-800">{usagePercentage}%</span>
        </div>

        <Progress
          value={usagePercentage}
          className="h-2 bg-slate-100"
          indicatorClassName={meterColor}
        />

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
          <span>{availableMB} MB available</span>
          <span className="inline-flex items-center gap-1 text-slate-400">
            <Layers className="w-3 h-3 text-slate-400" />
            Multi-tagging zero extra deduction
          </span>
        </div>
      </div>
    </div>
  )
}
