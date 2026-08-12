"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts"

import type { AreaCompliance } from "@/actions/dashboard.actions"

// ── Tooltip ────────────────────────────────────────────────────────────────

interface TooltipPayloadItem {
  value: number
  name: string
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2">
        <p className="text-xs font-medium text-slate-700">{label}</p>
        <p className="text-sm font-bold text-blue-600 mt-0.5">
          {payload[0].value}% complete
        </p>
      </div>
    )
  }
  return null
}

// ── Chart (dynamically loaded by ComplianceChart.tsx) ───────────────────

export function ComplianceChartInner({ data }: { data: AreaCompliance[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 60, left: 120, bottom: 0 }}
        barSize={20}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={false}
          stroke="#F1F5F9"
        />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={115}
          tick={{ fontSize: 12, fill: "#64748B" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={
                entry.value >= 90
                  ? "#10B981"
                  : entry.value >= 70
                    ? "#3B82F6"
                    : entry.value >= 50
                      ? "#F59E0B"
                      : "#EF4444"
              }
            />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v: number) => `${v}%`}
            style={{ fontSize: 12, fill: "#64748B", fontWeight: 500 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
