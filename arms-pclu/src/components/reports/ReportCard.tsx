"use client"

import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ReportCardProps {
  icon: LucideIcon
  title: string
  description: string
  iconColor: string
  iconBg: string
  onGenerate: () => void
  isLoading?: boolean
}

export function ReportCard({
  icon: Icon,
  title,
  description,
  iconColor,
  iconBg,
  onGenerate,
  isLoading,
}: ReportCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-xl border border-slate-200",
      "shadow-sm p-5 flex flex-col",
      "hover:shadow-md transition-all duration-200",
      "cursor-pointer group"
    )}>
      {/* Icon */}
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center",
        "justify-center flex-shrink-0",
        iconBg
      )}>
        <Icon className={cn("w-6 h-6", iconColor)} />
      </div>

      {/* Content */}
      <h3 className="text-base font-semibold text-slate-800 mt-3">
        {title}
      </h3>
      <p className="text-sm text-slate-500 mt-1 flex-1 leading-relaxed">
        {description}
      </p>

      {/* Action */}
      <Button
        onClick={onGenerate}
        disabled={isLoading}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
      >
        {isLoading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Generating...
          </>
        ) : (
          "Generate Report"
        )}
      </Button>
    </div>
  )
}
