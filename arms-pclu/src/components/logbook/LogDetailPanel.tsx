"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Paperclip,
  Download,
  Calendar,
  Hash,
  User,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface LogDetailPanelProps {
  open: boolean
  onClose: () => void
  entry: {
    id: string
    type: "INCOMING" | "OUTGOING"
    title: string
    date: string
    fromTo: string
    purpose: string
    refNo: string | null
    fileUrl: string | null
    fileName: string | null
    status: string
    adminRemarks: string | null
    acknowledgedAt: string | null
    userName: string
    createdAt: string
  } | null
  isAdmin?: boolean
  onAcknowledge?: (id: string) => void
  onReject?: (id: string) => void
}

export function LogDetailPanel({
  open,
  onClose,
  entry,
  isAdmin,
  onAcknowledge,
  onReject,
}: LogDetailPanelProps) {
  if (!entry) return null

  const isIncoming = entry.type === "INCOMING"

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-[440px] sm:max-w-[440px] overflow-y-auto p-0"
      >
        <SheetHeader className="px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="text-base font-semibold text-slate-900 leading-tight truncate flex-1">
              {entry.title}
            </SheetTitle>
            <StatusBadge status={entry.status} size="sm" />
          </div>
        </SheetHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Type indicator */}
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg",
            isIncoming
              ? "bg-blue-50 border border-blue-200"
              : "bg-emerald-50 border border-emerald-200"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              isIncoming ? "bg-blue-100" : "bg-emerald-100"
            )}>
              {isIncoming
                ? <ArrowDownLeft className="w-4 h-4 text-blue-600" />
                : <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              }
            </div>
            <div>
              <p className={cn(
                "text-sm font-semibold",
                isIncoming ? "text-blue-700" : "text-emerald-700"
              )}>
                {isIncoming ? "Incoming Document" : "Outgoing Document"}
              </p>
              <p className={cn(
                "text-xs",
                isIncoming ? "text-blue-500" : "text-emerald-500"
              )}>
                {isIncoming
                  ? `Received from: ${entry.fromTo}`
                  : `Sent to: ${entry.fromTo}`
                }
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {[
              {
                icon: Calendar,
                label: "Document Date",
                value: format(new Date(entry.date), "MMMM d, yyyy"),
              },
              {
                icon: Hash,
                label: "Reference Number",
                value: entry.refNo ?? "Not provided",
                mono: true,
              },
              {
                icon: User,
                label: "Logged by",
                value: entry.userName,
              },
              {
                icon: FileText,
                label: "Purpose",
                value: entry.purpose,
              },
            ].map((detail) => (
              <div key={detail.label} className="flex items-start gap-3">
                <detail.icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                    {detail.label}
                  </p>
                  <p className={cn(
                    "text-sm text-slate-700 mt-0.5",
                    detail.mono && "font-mono"
                  )}>
                    {detail.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Attached file */}
          {entry.fileUrl && entry.fileName && (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
              <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <p className="text-sm text-slate-700 flex-1 truncate">
                {entry.fileName}
              </p>
              <Button variant="ghost" size="sm" className="flex-shrink-0 h-7 px-2">
                <Download className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {/* Admin remarks */}
          {entry.adminRemarks && (
            <div className={cn(
              "p-3 rounded-lg border",
              entry.status === "REJECTED"
                ? "bg-red-50 border-red-200"
                : "bg-emerald-50 border-emerald-200"
            )}>
              <p className={cn(
                "text-xs font-semibold uppercase tracking-wide mb-1",
                entry.status === "REJECTED" ? "text-red-600" : "text-emerald-600"
              )}>
                {entry.status === "REJECTED" ? "Rejection Reason" : "Admin Remarks"}
              </p>
              <p className={cn(
                "text-sm italic",
                entry.status === "REJECTED" ? "text-red-700" : "text-emerald-700"
              )}>
                &quot;{entry.adminRemarks}&quot;
              </p>
              {entry.acknowledgedAt && (
                <p className="text-xs text-slate-400 mt-2">
                  {format(new Date(entry.acknowledgedAt), "MMM d, yyyy h:mm a")}
                </p>
              )}
            </div>
          )}

          {/* Admin actions */}
          {isAdmin && entry.status === "PENDING" && (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Admin Actions
              </p>
              <Button
                onClick={() => onAcknowledge?.(entry.id)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                ✓ Acknowledge Entry
              </Button>
              <Button
                variant="outline"
                onClick={() => onReject?.(entry.id)}
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
              >
                ✗ Reject Entry
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
