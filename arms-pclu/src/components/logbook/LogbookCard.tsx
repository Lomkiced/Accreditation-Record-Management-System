"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight, Calendar, Paperclip, CheckCircle, XCircle, Edit, Eye } from "lucide-react"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { AvatarInitials } from "@/components/shared/AvatarInitials"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface LogEntry {
  id: string
  type: "INCOMING" | "OUTGOING"
  title: string
  refNo?: string
  fromTo: string
  purpose: string
  date: string
  faculty: string
  status: "PENDING" | "ACKNOWLEDGED" | "REJECTED"
  hasAttachment: boolean
  remarks?: string
  acknowledgedDate?: string
}

interface LogbookCardProps {
  entry: LogEntry
  role: "admin" | "faculty"
  onAcknowledge?: (entry: LogEntry) => void
  onReject?: (entry: LogEntry) => void
  onEdit?: (entry: LogEntry) => void
  onView?: (entry: LogEntry) => void
}

export function LogbookCard({ entry, role, onAcknowledge, onReject, onEdit, onView }: LogbookCardProps) {
  const isIncoming = entry.type === "INCOMING"
  
  return (
    <div className={cn(
      "bg-white rounded-xl border shadow-sm p-4 flex gap-4 transition-colors",
      isIncoming ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-emerald-500",
      entry.status === "REJECTED" && "bg-red-50/30",
      entry.status === "ACKNOWLEDGED" && "bg-emerald-50/20"
    )}>
      {/* Type Badge */}
      <div className={cn(
        "flex flex-col items-center justify-center rounded-lg px-2 py-1 shrink-0 h-fit",
        isIncoming ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
      )}>
        <span className="text-[10px] font-bold tracking-widest uppercase">
          {isIncoming ? "IN" : "OUT"}
        </span>
      </div>

      {/* Center Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-slate-800 truncate">{entry.title}</h3>
          {entry.refNo && (
            <span className="text-[10px] font-mono text-slate-400 border border-slate-200 px-1.5 rounded bg-slate-50">
              {entry.refNo}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 text-sm mb-1.5 text-slate-700">
          {isIncoming ? (
            <ArrowLeft className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          )}
          <span className="truncate">{entry.fromTo}</span>
        </div>

        <p className="text-sm text-slate-500 truncate mb-2">{entry.purpose}</p>

        {entry.status === "REJECTED" && entry.remarks && (
          <p className="text-xs text-red-600 italic mb-2">
            “{entry.remarks}”
          </p>
        )}

        <div className="flex items-center gap-4 mt-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="w-3 h-3" />
            {entry.date}
          </div>
          {role === "admin" && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <AvatarInitials name={entry.faculty} size="sm" className="w-4 h-4 text-[8px]" />
              {entry.faculty}
            </div>
          )}
        </div>
      </div>

      {/* Right Content */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <div className="flex items-center gap-2 mb-auto">
          {entry.hasAttachment && (
            <button className="text-slate-400 hover:text-blue-600 transition-colors" title="View attachment">
              <Paperclip className="w-4 h-4" />
            </button>
          )}
          <StatusBadge status={entry.status} size="sm" />
        </div>

        {/* Admin Actions */}
        {role === "admin" && entry.status === "PENDING" && (
          <div className="flex items-center gap-2 mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => onReject?.(entry)}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Reject
            </Button>
            <Button 
              size="sm" 
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onAcknowledge?.(entry)}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Acknowledge
            </Button>
          </div>
        )}

        {/* Acknowledged info */}
        {entry.status === "ACKNOWLEDGED" && entry.acknowledgedDate && (
          <div className="text-[10px] text-slate-400 text-right mt-2">
            <div>Ack: {entry.acknowledgedDate}</div>
            {role === "faculty" && <div>by Admin</div>}
          </div>
        )}

        {/* Faculty Actions */}
        {role === "faculty" && (
          <div className="mt-2">
            {entry.status === "PENDING" ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600"
                onClick={() => onEdit?.(entry)}
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600"
                onClick={() => onView?.(entry)}
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
