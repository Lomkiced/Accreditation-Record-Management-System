"use client"

import * as React from "react"
import {
  FileText,
  Download,
  Eye,
  X,
  Tag as TagIcon,
  Plus,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FilePen,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { RepositoryDocument } from "./RepositoryTable"

// ─── Status chip ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  DRAFT:        { label: "Draft",        icon: FilePen,      className: "bg-slate-100 text-slate-600 border-slate-200" },
  SUBMITTED:    { label: "Submitted",    icon: Clock,        className: "bg-blue-100 text-blue-700 border-blue-200" },
  UNDER_REVIEW: { label: "Under Review", icon: AlertCircle,  className: "bg-amber-100 text-amber-700 border-amber-200" },
  APPROVED:     { label: "Approved",     icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  RETURNED:     { label: "Returned",     icon: XCircle,      className: "bg-red-100 text-red-700 border-red-200" },
}

function MappingStatusChip({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
        cfg.className
      )}
    >
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  )
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DocumentDetailPanelProps {
  open: boolean
  onClose: () => void
  document: RepositoryDocument | null
  /** All available tags for the add-tag picker */
  allTags?: { id: string; name: string; color: string }[]
  /** Called when a label tag is added/removed */
  onTagChange?: (documentId: string, tagId: string, add: boolean) => void
}

const DEFAULT_ALL_TAGS = [
  { id: "t1", name: "Priority",  color: "#EF4444" },
  { id: "t2", name: "For Review",color: "#F59E0B" },
  { id: "t3", name: "Finalized", color: "#10B981" },
  { id: "t4", name: "Archived",  color: "#64748B" },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function DocumentDetailPanel({
  open,
  onClose,
  document,
  allTags = DEFAULT_ALL_TAGS,
  onTagChange,
}: DocumentDetailPanelProps) {
  const [showTagAdd, setShowTagAdd] = React.useState(false)

  if (!document) return null

  // Group mappings by area for the detail panel
  const mappingsByArea = document.mappings.reduce<
    Record<string, { areaName: string; items: typeof document.mappings }>
  >((acc, m) => {
    if (!acc[m.areaName]) acc[m.areaName] = { areaName: m.areaName, items: [] }
    acc[m.areaName].items.push(m)
    return acc
  }, {})

  const tagIds = new Set(document.tags.map((t) => t.id))

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-[500px] sm:max-w-[500px] p-0 flex flex-col overflow-hidden bg-[#F8FAFC]"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-5 pb-4 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-start justify-between pr-6">
            <SheetTitle className="text-lg font-bold text-slate-900 leading-tight">
              {document.title}
            </SheetTitle>
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <MappingStatusChip status={document.dominantStatus} />
            <span className="text-xs text-slate-400 bg-white border px-2 py-0.5 rounded-full">
              {document.mappings.length} mapping
              {document.mappings.length !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-slate-400 bg-white border px-2 py-0.5 rounded-full font-mono">
              ID: {document.id.slice(0, 8)}…
            </span>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-5">
            {/* ── File card ── */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {document.fileName ?? `${document.title.replace(/\s+/g, "_")}.pdf`}
                  </p>
                  <p className="text-xs text-slate-500">
                    Uploaded {document.uploadedAt}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs text-blue-600"
                  onClick={() => {
                    if (document.fileUrl) {
                      window.open(document.fileUrl, "_blank")
                    }
                  }}
                  disabled={!document.fileUrl}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs text-emerald-600"
                  onClick={() => {
                    if (document.fileUrl) {
                      // Supabase public URLs support ?download= to force download
                      window.open(`${document.fileUrl}?download=`, "_blank")
                    }
                  }}
                  disabled={!document.fileUrl}
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Download
                </Button>
              </div>
            </div>

            {/* ── Evidence Mappings ── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-800">
                  Evidence Mappings
                </h3>
                <span className="ml-auto text-xs text-slate-400">
                  {document.mappings.length} indicator
                  {document.mappings.length !== 1 ? "s" : ""}
                </span>
              </div>

              {document.mappings.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <MapPin className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 italic">
                    This document hasn&apos;t been mapped to any indicators yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {Object.values(mappingsByArea).map(({ areaName, items }) => (
                    <div key={areaName}>
                      {/* Area group header */}
                      <div className="px-4 py-2 bg-slate-50">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          {areaName}
                        </span>
                      </div>
                      {items.map((mapping) => (
                        <div
                          key={mapping.id}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-400 mb-0.5">
                              {mapping.criterionName}
                            </p>
                            <p className="text-sm font-medium text-slate-800 leading-snug">
                              {mapping.indicatorName}
                            </p>
                          </div>
                          <MappingStatusChip status={mapping.status} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Document Info ── */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                Document Info
              </h3>
              <div className="space-y-2">
                <div className="flex gap-3">
                  <span className="text-xs text-slate-400 w-24 shrink-0 pt-0.5">
                    Faculty
                  </span>
                  <span className="text-sm text-slate-700 font-medium">
                    {document.faculty}
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="text-xs text-slate-400 w-24 shrink-0 pt-0.5">
                    Uploaded On
                  </span>
                  <span className="text-sm text-slate-700">
                    {document.uploadedAt}
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="text-xs text-slate-400 w-24 shrink-0 pt-0.5">
                    Areas Tagged
                  </span>
                  <span className="text-sm text-slate-700">
                    {[...new Set(document.mappings.map((m) => m.areaName))].join(
                      ", "
                    ) || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Label Tags ── */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <TagIcon className="w-4 h-4 text-slate-400" /> Labels
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-blue-600"
                  onClick={() => setShowTagAdd(!showTagAdd)}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Label
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      border: `1px solid ${tag.color}40`,
                    }}
                  >
                    {tag.name}
                    <button
                      className="hover:bg-black/10 rounded-full p-0.5 ml-1 transition-colors"
                      onClick={() => onTagChange?.(document.id, tag.id, false)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {document.tags.length === 0 && (
                  <span className="text-sm text-slate-400 italic">
                    No labels added.
                  </span>
                )}
              </div>

              {showTagAdd && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Add a label:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allTags
                      .filter((t) => !tagIds.has(t.id))
                      .map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: `${tag.color}10`,
                            color: tag.color,
                            border: `1px solid ${tag.color}30`,
                          }}
                          onClick={() => {
                            onTagChange?.(document.id, tag.id, true)
                            setShowTagAdd(false)
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
