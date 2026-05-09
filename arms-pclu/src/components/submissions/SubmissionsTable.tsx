"use client"

import * as React from "react"
import { Eye, Download } from "lucide-react"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { AvatarInitials } from "@/components/shared/AvatarInitials"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ColumnDef } from "@tanstack/react-table"

export interface Submission {
  id: string
  title: string
  faculty: string
  area: { number: number; name: string }
  criterion: string
  submittedAt: string
  version: number
  status: string
}

interface SubmissionsTableProps {
  data: Submission[]
  onRowClick: (submission: Submission) => void
}

export function SubmissionsTable({ data, onRowClick }: SubmissionsTableProps) {
  // Cycling colors for the number badge
  const COLORS = [
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
    "bg-orange-100 text-orange-700",
    "bg-teal-100 text-teal-700",
  ]

  const columns: ColumnDef<Submission>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="ml-2"
        />
      ),
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="ml-2"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: "Document Title",
      cell: ({ row }) => (
        <span 
          className="font-medium text-slate-800 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => onRowClick(row.original)}
        >
          {row.getValue("title")}
        </span>
      ),
    },
    {
      accessorKey: "faculty",
      header: "Faculty",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <AvatarInitials name={row.getValue("faculty")} size="sm" />
          <span className="text-sm">{row.getValue("faculty")}</span>
        </div>
      ),
    },
    {
      accessorKey: "area",
      header: "Area",
      cell: ({ row }) => {
        const area = row.original.area
        const colorClass = COLORS[(area.number - 1) % COLORS.length]
        return (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
            Area {area.number}
          </span>
        )
      },
    },
    {
      accessorKey: "criterion",
      header: "Criterion",
      cell: ({ row }) => (
        <span className="text-sm text-slate-500 truncate max-w-[150px] inline-block">
          {row.getValue("criterion")}
        </span>
      ),
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted",
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("submittedAt")}</span>
      ),
    },
    {
      accessorKey: "version",
      header: "Version",
      cell: ({ row }) => {
        const version = row.getValue("version") as number
        return (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${version > 1 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
            v{version}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.getValue("status")} size="sm" />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            {status === "PENDING" || status === "UNDER_REVIEW" ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => onRowClick(row.original)}
              >
                Review
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => onRowClick(row.original)}>
                <Eye className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <DataTable columns={columns} data={data} />
    </div>
  )
}
