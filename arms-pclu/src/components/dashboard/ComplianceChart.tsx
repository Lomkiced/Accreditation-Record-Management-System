"use client"

import dynamic from "next/dynamic"
import { useComplianceData } from "@/hooks/useDashboard"

// ── Lazy-load the recharts-based chart ─────────────────────────────────────
// Recharts is ~200KB gzipped. Loading it dynamically keeps the initial
// dashboard JS bundle lean. The skeleton matches the chart's 300px height.
const RechartsChart = dynamic(
  () => import("./ComplianceChartInner").then((m) => ({ default: m.ComplianceChartInner })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-sm text-slate-500 animate-pulse">Loading chart…</p>
      </div>
    ),
  }
)

export function ComplianceChart() {
  const { data = [], isLoading } = useComplianceData()

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-base font-semibold text-slate-800">
        PACUCOA Compliance Overview
      </h3>
      <p className="text-sm text-slate-400 mt-0.5 mb-5">
        Document submission progress per area
      </p>

      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-slate-500 animate-pulse">Loading chart data...</p>
        </div>
      ) : (
        <RechartsChart data={data} />
      )}
    </div>
  )
}

