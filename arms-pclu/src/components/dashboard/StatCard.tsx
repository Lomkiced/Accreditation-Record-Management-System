import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  color: "blue" | "amber" | "emerald" | "violet" | "rose"
  trend?: {
    value: string
    isPositive: boolean
  }
}

export function StatCard({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) {
  const colorMap = {
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600",
    },
    emerald: {
      bg: "bg-emerald-50",
      icon: "text-emerald-600",
    },
    amber: {
      bg: "bg-amber-50",
      icon: "text-amber-600",
    },
    violet: {
      bg: "bg-violet-50",
      icon: "text-violet-600",
    },
    rose: {
      bg: "bg-rose-50",
      icon: "text-rose-600",
    },
  }

  const colors = colorMap[color] ?? colorMap.blue

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            colors.bg
          )}
        >
          <Icon className={cn("w-5 h-5", colors.icon)} />
        </div>

        {trend && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              trend.isPositive ? "text-emerald-600" : "text-red-500"
            )}
          >
            {trend.isPositive ? "↑" : "↓"}
            {trend.value}
          </span>
        )}
      </div>

      <p className="text-3xl font-bold text-slate-900 mt-3 leading-none">
        {value}
      </p>

      <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>

      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}
