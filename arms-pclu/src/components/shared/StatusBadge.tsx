import * as React from "react"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  size?: "sm" | "md"
  className?: string
}

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const statusConfig: Record<
    string,
    {
      label: string
      className: string
    }
  > = {
    DRAFT: {
      label: "Draft",
      className: "bg-slate-100 text-slate-600 border-slate-200",
    },
    SUBMITTED: {
      label: "Submitted",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    UNDER_REVIEW: {
      label: "Under Review",
      className: "bg-purple-50 text-purple-700 border-purple-200",
    },
    APPROVED: {
      label: "Approved",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    RETURNED: {
      label: "Returned",
      className: "bg-red-50 text-red-700 border-red-200",
    },
    PENDING: {
      label: "Pending",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    ACKNOWLEDGED: {
      label: "Acknowledged",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    REJECTED: {
      label: "Rejected",
      className: "bg-red-50 text-red-700 border-red-200",
    },
    INCOMING: {
      label: "Incoming",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    OUTGOING: {
      label: "Outgoing",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    ACTIVE: {
      label: "Active",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    INACTIVE: {
      label: "Inactive",
      className: "bg-slate-100 text-slate-500 border-slate-200",
    },
  }

  const sizeClass = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-0.5",
  }

  const config = statusConfig[status.toUpperCase()] ?? statusConfig.DRAFT

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full",
        "font-medium border",
        sizeClass[size],
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
