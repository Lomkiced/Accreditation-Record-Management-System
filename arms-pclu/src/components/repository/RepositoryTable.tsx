"use client"

import * as React from "react"
import { Eye, Download, Tag, MapPin } from "lucide-react"
import { DataTable } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { AvatarInitials } from "@/components/shared/AvatarInitials"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ColumnDef } from "@tanstack/react-table"

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single indicator mapping summary shown in the table row */
export interface DocumentMappingSummary {
  id: string
  indicatorId: string
  indicatorName: string
  criterionName: string
  areaName: string
  status: string
}

/** Document row shape for the repository table (M:N aware) */
export interface RepositoryDocument {
  id: string
  title: string
  fileName: string | null
  fileUrl: string | null
  faculty: string
  uploadedAt: string
  rawDate: Date
  /** A document can be mapped to many indicators across many areas */
  mappings: DocumentMappingSummary[]
  /** Custom label tags */
  tags: { id: string; name: string; color: string }[]
  /** The "dominant" status for display (most recent / highest precedence) */
  dominantStatus: string
}

interface RepositoryTableProps {
  data: RepositoryDocument[]
  onRowClick: (doc: RepositoryDocument) => void
}

// ─── Dominant status logic ────────────────────────────────────────────────────
// Priority: APPROVED > UNDER_REVIEW > SUBMITTED > RETURNED > DRAFT > (none)
const STATUS_PRIORITY: Record<string, number> = {
  APPROVED: 5,
  UNDER_REVIEW: 4,
  SUBMITTED: 3,
  RETURNED: 2,
  DRAFT: 1,
}

export function getDominantStatus(mappings: { status: string }[]): string {
  if (mappings.length === 0) return "DRAFT"
  return mappings.reduce((best, m) =>
    (STATUS_PRIORITY[m.status] ?? 0) > (STATUS_PRIORITY[best.status] ?? 0)
      ? m
      : best
  ).status
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RepositoryTable({ data, onRowClick }: RepositoryTableProps) {
  const columns: ColumnDef<RepositoryDocument>[] = [
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
      accessorKey: "mappings",
      header: "Mapped To",
      cell: ({ row }) => {
        const mappings = row.original.mappings
        if (mappings.length === 0) {
          return (
            <span className="text-xs text-slate-400 italic">Not mapped yet</span>
          )
        }
        // Group by area for compact display
        const areaNames = [...new Set(mappings.map((m) => m.areaName))]
        return (
          <div className="flex flex-wrap gap-1">
            {areaNames.slice(0, 3).map((areaName) => {
              const areaIdx =
                [
                  "Area 1","Area 2","Area 3","Area 4",
                  "Area 5","Area 6","Area 7","Area 8",
                ].indexOf(areaName)
              const BADGE_COLORS = [
                "bg-blue-100 text-blue-700",
                "bg-violet-100 text-violet-700",
                "bg-emerald-100 text-emerald-700",
                "bg-amber-100 text-amber-700",
                "bg-rose-100 text-rose-700",
                "bg-cyan-100 text-cyan-700",
                "bg-orange-100 text-orange-700",
                "bg-teal-100 text-teal-700",
              ]
              const colorClass = BADGE_COLORS[areaIdx >= 0 ? areaIdx : 0]
              return (
                <span
                  key={areaName}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colorClass}`}
                >
                  {areaName}
                </span>
              )
            })}
            {areaNames.length > 3 && (
              <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
                +{areaNames.length - 3} more
              </span>
            )}
          </div>
        )
      },
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
      accessorKey: "uploadedAt",
      header: "Date Uploaded",
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">{row.getValue("uploadedAt")}</span>
      ),
    },
    {
      accessorKey: "tags",
      header: "Labels",
      cell: ({ row }) => {
        const tags = row.original.tags
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  border: `1px solid ${tag.color}40`,
                }}
              >
                {tag.name}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="text-[10px] bg-slate-100 text-slate-600 border-slate-200 border px-2 py-0.5 rounded-full font-medium">
                +{tags.length - 2} more
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "dominantStatus",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.getValue("dominantStatus")} size="sm" />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-blue-600"
            onClick={() => onRowClick(row.original)}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <DataTable columns={columns} data={data} />
    </div>
  )
}
