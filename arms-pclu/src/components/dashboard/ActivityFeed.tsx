"use client"

import * as React from "react"
import { AvatarInitials } from "../shared/AvatarInitials"
import { cn } from "@/lib/utils"

import { useRecentAuditLogs } from "@/hooks/useDashboard"
import type { RecentAuditLog } from "@/actions/dashboard.actions"
import { formatDistanceToNow } from "date-fns"

const ACTION_LABELS: Record<string, string> = {
  UPLOAD_DOCUMENT: "Uploaded a document",
  CREATE_EVIDENCE_MAPPINGS: "Tagged evidence to indicators",
  SUBMIT_MAPPING: "Submitted a mapping for review",
  SUBMIT_ALL_MAPPINGS: "Submitted all mappings",
  REVIEW_MAPPING: "Reviewed a mapping",
  DELETE_MAPPING: "Deleted a mapping",
  CREATE_FACULTY_ACCOUNT: "Created a faculty account",
  UPDATE_PROFILE: "Updated their profile",
  CHANGE_PASSWORD: "Changed their password",
  RESET_PASSWORD: "Reset a user's password",
  UPDATE_FACULTY_PROFILE: "Updated a faculty profile",
}

export function ActivityFeed() {
  const { data: logs = [], isLoading } = useRecentAuditLogs()
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
      <h3 className="text-base font-semibold text-slate-800 flex-shrink-0">
        Recent Activity
      </h3>

      <div className="mt-4 flex-1 overflow-y-auto max-h-[260px] space-y-1 -mr-2 pr-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-slate-500 animate-pulse">Loading activity...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-slate-500">No recent activity.</p>
          </div>
        ) : (
          logs.map((log: RecentAuditLog) => {
            const actionText = ACTION_LABELS[log.action] ?? log.action.toLowerCase().replace(/_/g, " ")
            const docTitle = log.details && typeof (log.details as any).documentTitle === "string" 
              ? (log.details as any).documentTitle 
              : ""

            return (
              <div
                key={log.id}
                className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors px-2 rounded-lg"
              >
                <AvatarInitials
                  name={log.user.name}
                  size="sm"
                  className="flex-shrink-0 mt-0.5"
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 leading-snug">
                    <span className="font-semibold">{log.user.name}</span>{" "}
                    {actionText}
                  </p>
                  {docTitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{docTitle}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </p>
                </div>

                <span
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0 mt-1.5",
                    log.module === "DOCUMENT" && "bg-blue-500",
                    log.module === "REVIEW" && "bg-emerald-500",
                    log.module === "LOGBOOK" && "bg-violet-500",
                    log.module === "USER" && "bg-amber-500",
                    log.module === "AUTH" && "bg-slate-400"
                  )}
                />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
