"use client"

import {
  FileText,
  CheckCircle,
  XCircle,
  BookMarked,
  UserCheck,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

type NotificationType =
  | "submission"
  | "approval"
  | "returned"
  | "logbook"
  | "assignment"
  | "general"

interface NotificationItemProps {
  id: string
  title: string
  description: string
  type: NotificationType
  isRead: boolean
  createdAt: string
  actionLabel?: string
  actionHref?: string
  onMarkRead?: (id: string) => void
}

const typeConfig: Record<NotificationType, {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  borderColor: string
}> = {
  submission: {
    icon: FileText,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    borderColor: "border-l-blue-500",
  },
  approval: {
    icon: CheckCircle,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    borderColor: "border-l-emerald-500",
  },
  returned: {
    icon: XCircle,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    borderColor: "border-l-red-500",
  },
  logbook: {
    icon: BookMarked,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    borderColor: "border-l-amber-500",
  },
  assignment: {
    icon: UserCheck,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    borderColor: "border-l-violet-500",
  },
  general: {
    icon: Bell,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
    borderColor: "border-l-slate-400",
  },
}

export function NotificationItem({
  id,
  title,
  description,
  type,
  isRead,
  createdAt,
  actionLabel,
  actionHref,
  onMarkRead,
}: NotificationItemProps) {
  const config = typeConfig[type] ?? typeConfig.general
  const Icon = config.icon

  return (
    <div
      onClick={() => !isRead && onMarkRead?.(id)}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl",
        "border transition-all duration-150 cursor-pointer",
        "border-l-4",
        config.borderColor,
        !isRead
          ? "bg-blue-50/40 border-slate-200 hover:bg-blue-50/60"
          : "bg-white border-slate-100 hover:bg-slate-50"
      )}
    >
      {/* Icon */}
      <div className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
        config.iconBg
      )}>
        <Icon className={cn("w-4 h-4", config.iconColor)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm leading-snug",
          !isRead ? "font-semibold text-slate-900" : "font-medium text-slate-700"
        )}>
          {title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          {description}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {formatDistanceToNow(new Date(createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {/* Unread dot */}
        {!isRead && (
          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
        )}

        {/* Action button */}
        {actionLabel && actionHref && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2.5 whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation()
              window.location.href = actionHref
            }}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
