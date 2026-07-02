"use client"

import * as React from "react"
import { Edit, Trash2, Tag as TagIcon } from "lucide-react"
import { DataTable } from "@/components/shared/DataTable"
import { EmptyState } from "@/components/shared/EmptyState"
import { TagBadge } from "./TagBadge"
import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface CustomTag {
  id: string
  name: string
  color: string
  documentsCount: number
  createdAt: string
}

interface TagListProps {
  tags: CustomTag[]
  onEdit: (tag: CustomTag) => void
  onDelete: (tag: CustomTag) => void
}

export function TagList({ tags, onEdit, onDelete }: TagListProps) {
  if (tags.length === 0) {
    return (
      <EmptyState
        icon={TagIcon}
        title="No custom tags yet"
        description="Create custom tags to better organize your accreditation documents."
      />
    )
  }

  const columns: ColumnDef<CustomTag>[] = [
    {
      id: "preview",
      header: "Preview",
      cell: ({ row }) => (
        <TagBadge name={row.original.name} color={row.original.color} size="sm" />
      ),
    },
    {
      accessorKey: "name",
      header: "Tag Name",
      cell: ({ row }) => (
        <span className="font-medium text-slate-800">{row.getValue("name")}</span>
      ),
    },
    {
      accessorKey: "color",
      header: "Color Code",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: row.getValue("color") }} />
          <span className="text-xs font-mono text-slate-500 uppercase">{row.getValue("color")}</span>
        </div>
      ),
    },
    {
      accessorKey: "documentsCount",
      header: "Documents Tagged",
      cell: ({ row }) => {
        const count = row.getValue("documentsCount") as number
        return (
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
            {count}
          </span>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => <span className="text-sm text-slate-600">{row.getValue("createdAt")}</span>,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => onEdit(row.original)}>
              <Edit className="w-4 h-4" />
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-red-500"
                      onClick={() => onDelete(row.original)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete tag</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )
      },
    },
  ]

  return <DataTable columns={columns} data={tags} />
}
