"use client"

import * as React from "react"
import { Search, Download, Filter } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ColumnDef } from "@tanstack/react-table"
import { AvatarInitials } from "@/components/shared/AvatarInitials"
import { useAuditLogs } from "@/hooks/useAuditLogs"
import type { AuditLogWithUser } from "@/actions/audit.actions"
import { Skeleton } from "@/components/ui/skeleton"

export default function AuditLogsPage() {
  const { data: logs = [], isLoading } = useAuditLogs()
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredLogs = React.useMemo(() => {
    if (!searchQuery) return logs
    const q = searchQuery.toLowerCase()
    return logs.filter(log => 
      log.user.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.module.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q)
    )
  }, [logs, searchQuery])

  const columns: ColumnDef<AuditLogWithUser>[] = [
    {
      accessorKey: "timestamp",
      header: "Timestamp",
      cell: ({ row }) => <span className="text-sm font-medium text-slate-700">{row.getValue("timestamp")}</span>,
    },
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <AvatarInitials name={row.getValue("user")} size="sm" />
          <span className="text-sm">{row.getValue("user")}</span>
        </div>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const action = row.getValue("action") as string
        let colorClass = "bg-slate-100 text-slate-700"
        if (action.includes("APPROVED") || action.includes("CREATE")) colorClass = "bg-emerald-100 text-emerald-700"
        else if (action.includes("SUBMITTED") || action.includes("UPLOAD") || action.includes("LOGGED")) colorClass = "bg-blue-100 text-blue-700"
        else if (action.includes("ASSIGN") || action.includes("UPDATE")) colorClass = "bg-violet-100 text-violet-700"
        else if (action.includes("DELETE") || action.includes("RETURNED")) colorClass = "bg-red-100 text-red-700"
        
        return (
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${colorClass}`}>
            {action}
          </span>
        )
      },
    },
    {
      accessorKey: "module",
      header: "Module",
      cell: ({ row }) => <span className="text-sm text-slate-600">{row.getValue("module")}</span>,
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 truncate max-w-xs block" title={row.getValue("details")}>
          {row.getValue("details")}
        </span>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Audit Logs"
        subtitle="System-wide activity monitoring and tracking"
        actions={
          <Button variant="outline" className="text-slate-700 bg-white shadow-sm">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search logs by user, action, or details..." 
              className="pl-9 h-9" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button variant="outline" size="sm" className="h-9 text-slate-600 bg-slate-50">
            <Filter className="w-4 h-4 mr-2" />
            Module
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-slate-600 bg-slate-50">
            Date Range
          </Button>

          <div className="ml-auto text-sm text-slate-500 font-medium">
            Showing {filteredLogs.length} entries
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex gap-4 border-b border-slate-100 pb-4">
              <Skeleton className="h-6 w-full" />
            </div>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <DataTable columns={columns} data={filteredLogs} />
        )}
      </div>
    </>
  )
}
