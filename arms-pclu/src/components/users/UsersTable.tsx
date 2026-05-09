"use client"

import * as React from "react"
import { Edit, Eye, Power, PowerOff } from "lucide-react"
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

export interface User {
  id: string
  name: string
  email: string
  department: string
  designation: string
  assignedAreas: number
  status: "ACTIVE" | "INACTIVE"
  lastLogin: string | null
}

interface UsersTableProps {
  data: User[]
  onEdit: (user: User) => void
  onToggleStatus: (user: User) => void
}

export function UsersTable({ data, onEdit, onToggleStatus }: UsersTableProps) {
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Faculty",
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
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => (
        <span className="text-sm text-slate-700">{row.getValue("department")}</span>
      ),
    },
    {
      accessorKey: "designation",
      header: "Designation",
      cell: ({ row }) => (
        <span className="text-sm text-slate-500">{row.getValue("designation")}</span>
      ),
    },
    {
      accessorKey: "assignedAreas",
      header: "Assigned Areas",
      cell: ({ row }) => {
        const count = row.getValue("assignedAreas") as number
        if (count === 0) {
          return <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">None</span>
        }
        return <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">{count}</span>
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
      accessorKey: "lastLogin",
      header: "Last Login",
      cell: ({ row }) => {
        const lastLogin = row.getValue("lastLogin") as string | null
        return (
          <span className="text-sm text-slate-500">
            {lastLogin ? lastLogin : "Never"}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const isActive = row.original.status === "ACTIVE"
        return (
          <div className="flex items-center justify-end gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => onEdit(row.original)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Edit Faculty</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                    <Eye className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>View Assignments</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 ${isActive ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                    onClick={() => onToggleStatus(row.original)}
                  >
                    {isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isActive ? 'Deactivate' : 'Activate'}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )
      },
    },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <DataTable columns={columns} data={data} />
    </div>
  )
}
