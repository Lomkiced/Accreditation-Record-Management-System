"use client"

import * as React from "react"
import { Search, Download, Filter } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ColumnDef } from "@tanstack/react-table"
import { AvatarInitials } from "@/components/shared/AvatarInitials"

export interface AuditLog {
  id: string
  timestamp: string
  user: string
  action: string
  module: string
  details: string
  ipAddress: string
}

const mockLogs: AuditLog[] = [
  { id: "LOG-1024", timestamp: "Oct 12, 2024 14:32:10", user: "Admin User", action: "Approved Document", module: "Submissions", details: "Approved 'Faculty Development Plan 2024'", ipAddress: "192.168.1.105" },
  { id: "LOG-1023", timestamp: "Oct 12, 2024 14:30:05", user: "Admin User", action: "Viewed Document", module: "Submissions", details: "Viewed 'Faculty Development Plan 2024'", ipAddress: "192.168.1.105" },
  { id: "LOG-1022", timestamp: "Oct 12, 2024 10:15:22", user: "Dr. Juan Perez", action: "Submitted Document", module: "Submissions", details: "Submitted 'Faculty Development Plan 2024' (v2)", ipAddress: "192.168.1.201" },
  { id: "LOG-1021", timestamp: "Oct 11, 2024 16:45:00", user: "Maria Clara", action: "Logged In", module: "Authentication", details: "Successful login", ipAddress: "192.168.1.205" },
  { id: "LOG-1020", timestamp: "Oct 11, 2024 15:20:11", user: "Admin User", action: "Assigned Area", module: "Assignments", details: "Assigned Area 4 to Maria Clara", ipAddress: "192.168.1.105" },
]

export default function AuditLogsPage() {
  const columns: ColumnDef<AuditLog>[] = [
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
        if (action.includes("Approved")) colorClass = "bg-emerald-100 text-emerald-700"
        else if (action.includes("Submitted") || action.includes("Logged")) colorClass = "bg-blue-100 text-blue-700"
        else if (action.includes("Assigned")) colorClass = "bg-violet-100 text-violet-700"
        
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
      cell: ({ row }) => <span className="text-sm text-slate-600">{row.getValue("details")}</span>,
    },
    {
      accessorKey: "ipAddress",
      header: "IP Address",
      cell: ({ row }) => <span className="text-xs font-mono text-slate-400">{row.getValue("ipAddress")}</span>,
    },
  ]

  return (
    <>
      <PageHeader
        title="Audit Logs"
        subtitle="System-wide activity monitoring and tracking"
        actions={
          <Button variant="outline" className="text-slate-700 bg-white">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Search logs by user, action, or details..." className="pl-9 h-9" />
          </div>
          
          <Button variant="outline" size="sm" className="h-9 text-slate-600 bg-slate-50">
            <Filter className="w-4 h-4 mr-2" />
            Module
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-slate-600 bg-slate-50">
            Date Range
          </Button>

          <div className="ml-auto text-sm text-slate-500">
            Showing {mockLogs.length} entries
          </div>
        </div>

        <DataTable columns={columns} data={mockLogs} />
      </div>
    </>
  )
}
