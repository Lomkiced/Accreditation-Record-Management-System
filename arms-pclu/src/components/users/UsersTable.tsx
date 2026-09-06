"use client"

import * as React from "react"
import { Edit, Trash2 } from "lucide-react"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { AvatarInitials } from "@/components/shared/AvatarInitials"
import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { type UserWithCounts } from "@/actions/user.actions"

interface UsersTableProps {
  data: UserWithCounts[]
  onEdit: (user: UserWithCounts) => void
  onDelete: (user: UserWithCounts) => void
  hideDepartment?: boolean
  hideStatus?: boolean
}

export function UsersTable({ 
  data, 
  onEdit, 
  onDelete, 
  hideDepartment = false, 
  hideStatus = false 
}: UsersTableProps) {
  const columns = React.useMemo<ColumnDef<UserWithCounts>[]>(() => {
    const cols: ColumnDef<UserWithCounts>[] = [
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <AvatarInitials name={row.original.name} size="md" />
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 leading-tight">{row.original.name}</span>
              <span className="text-xs text-slate-500">{row.original.email}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const role = row.original.role
          const color = role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
          return (
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${color}`}>
              {role}
            </span>
          )
        },
      },
    ]

    if (!hideDepartment) {
      cols.push({
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">{row.getValue("department")}</span>
        ),
      })
    }

    cols.push({
      accessorKey: "designation",
      header: "Designation",
      cell: ({ row }) => (
        <span className="text-sm text-slate-500">{row.getValue("designation")}</span>
      ),
    })

    if (!hideStatus) {
      cols.push({
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge status={row.getValue("status")} size="sm" />
        ),
      })
    }

    cols.push({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => onEdit(row.original)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Edit User</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(row.original)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Delete Account</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )
      },
    })

    return cols
  }, [hideDepartment, hideStatus, onEdit, onDelete])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <DataTable columns={columns} data={data} />
    </div>
  )
}
