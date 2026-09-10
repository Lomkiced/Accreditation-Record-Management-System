"use client"

import * as React from "react"
import { Search, Filter, Trash2, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ColumnDef } from "@tanstack/react-table"
import { AvatarInitials } from "@/components/shared/AvatarInitials"
import { useAuditLogs, useClearAuditLogs } from "@/hooks/useAuditLogs"
import type { AuditLogWithUser } from "@/actions/audit.actions"
import { Skeleton } from "@/components/ui/skeleton"

export default function AuditLogsPage() {
  const { data: logs = [], isLoading } = useAuditLogs()
  const clearLogsMutation = useClearAuditLogs()
  const [isClearModalOpen, setIsClearModalOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedModule, setSelectedModule] = React.useState("all")
  const [dateRange, setDateRange] = React.useState("all")

  const modules = React.useMemo(() => {
    return Array.from(new Set(logs.map(l => l.module))).sort()
  }, [logs])

  const filteredLogs = React.useMemo(() => {
    let result = logs
    
    if (selectedModule !== "all") {
      result = result.filter(log => log.module === selectedModule)
    }

    if (dateRange !== "all") {
      const now = new Date()
      let cutoff = new Date()
      if (dateRange === "today") {
        cutoff.setHours(0,0,0,0)
      } else if (dateRange === "7days") {
        cutoff.setDate(cutoff.getDate() - 7)
      } else if (dateRange === "30days") {
        cutoff.setDate(cutoff.getDate() - 30)
      }
      
      result = result.filter(log => new Date(log.rawDate) >= cutoff)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(log => 
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q)
      )
    }
    return result
  }, [logs, searchQuery, selectedModule, dateRange])

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
        <span className="text-xs text-slate-700 leading-relaxed max-w-md block" title={row.getValue("details")}>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsClearModalOpen(true)}
            disabled={logs.length === 0 || clearLogsMutation.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shadow-sm"
          >
            {clearLogsMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Clear All Logs
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
          
          <Select value={selectedModule} onValueChange={setSelectedModule}>
            <SelectTrigger className="w-[150px] h-9 text-slate-600 bg-slate-50 border-slate-200">
              <div className="flex items-center gap-2 truncate">
                <Filter className="w-4 h-4 shrink-0" />
                <span className="truncate">{selectedModule === "all" ? "All Modules" : selectedModule}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Modules</SelectItem>
              {modules.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px] h-9 text-slate-600 bg-slate-50 border-slate-200">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>

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

      {/* Clear All Audit Logs Confirmation Modal */}
      <AlertDialog open={isClearModalOpen} onOpenChange={setIsClearModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Audit Logs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all audit logs? This action will permanently remove all past historical activity entries from the system. A single audit entry will record who cleared the logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearLogsMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={clearLogsMutation.isPending}
              onClick={async (e) => {
                e.preventDefault()
                await clearLogsMutation.mutateAsync()
                setIsClearModalOpen(false)
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {clearLogsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                "Yes, Clear All Logs"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
