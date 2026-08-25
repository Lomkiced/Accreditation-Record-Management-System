"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { FileText, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { getComplianceDataWithCounts } from "@/actions/dashboard.actions"
import type { AreaComplianceWithCounts } from "@/actions/dashboard.actions"

// Roman numeral converter for area numbering
const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]

function getStatusConfig(value: number): {
  label: string
  dotColor: string
  textColor: string
  bgColor: string
  barColor: string
} {
  if (value >= 100) {
    return {
      label: "Complete",
      dotColor: "bg-emerald-500",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-50",
      barColor: "bg-emerald-500",
    }
  }
  if (value >= 50) {
    return {
      label: "In Progress",
      dotColor: "bg-blue-500",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
      barColor: "bg-blue-500",
    }
  }
  return {
    label: "Needs Attention",
    dotColor: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
    barColor: "bg-red-500",
  }
}

function AreaRow({ area, index }: { area: AreaComplianceWithCounts; index: number }) {
  const status = getStatusConfig(area.value)
  const roman = ROMAN_NUMERALS[index] ?? `${index + 1}`

  return (
    <div className="flex items-center gap-4 py-3 group hover:bg-slate-50/50 transition-colors px-1 rounded-lg">
      {/* Area name */}
      <div className="flex items-center gap-3 w-[280px] min-w-0 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <p className="text-sm font-medium text-slate-700 truncate">
          <span className="text-slate-400 mr-1.5">Area {roman}</span>
          <span className="text-slate-300 mr-1.5">–</span>
          {area.name}
        </p>
      </div>

      {/* Indicator count badge */}
      <div className="w-[100px] shrink-0 text-center">
        <span
          title={`${area.providedEvidences} indicators provided out of ${area.totalIndicators} total indicators`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full"
        >
          {area.providedEvidences}
          <span className="text-slate-400">/</span>
          {area.totalIndicators}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex-1 flex items-center gap-3">
        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${area.value}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: index * 0.08 }}
            className={`h-full rounded-full ${status.barColor}`}
          />
        </div>
        <span className="text-sm font-bold text-slate-700 w-10 text-right tabular-nums">
          {area.value}%
        </span>
      </div>

      {/* Status badge */}
      <div className="w-[140px] flex justify-end shrink-0">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.bgColor} ${status.textColor}`}>
          <span className={`w-2 h-2 rounded-full ${status.dotColor}`} />
          {status.label}
        </span>
      </div>
    </div>
  )
}

export function ProgressByArea() {
  const { data: areas = [], isLoading, error } = useQuery({
    queryKey: ["compliance", "by-area-with-counts"],
    queryFn: async () => {
      const result = await getComplianceDataWithCounts()
      return result
    },
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400 mr-2" />
        <span className="text-sm text-slate-500">Loading progress data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-red-500">
        Failed to load compliance data.
      </div>
    )
  }

  return (
    <div>
      {/* Table Header */}
      <div className="flex items-center gap-4 px-1 mb-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider w-[280px] shrink-0">
          Area
        </p>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider w-[100px] shrink-0 text-center">
          Indicators
        </p>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex-1">
          Progress
        </p>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider w-[140px] text-right shrink-0">
          Status
        </p>
      </div>

      {/* Area Rows */}
      <div className="divide-y divide-slate-100">
        {areas.map((area, idx) => (
          <AreaRow key={area.name} area={area} index={idx} />
        ))}
      </div>

      {areas.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-8">
          No areas have been configured yet.
        </p>
      )}

      {/* Legend */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500">Indicators =</span>
          <span className="text-xs font-semibold text-slate-700">provided / total indicators</span>
        </div>
        <div className="w-px h-3 bg-slate-200" />
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-slate-500">Complete (100%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-xs font-medium text-slate-500">In Progress (50% – 99%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-xs font-medium text-slate-500">Needs Attention (0% – 49%)</span>
        </div>
      </div>
    </div>
  )
}
