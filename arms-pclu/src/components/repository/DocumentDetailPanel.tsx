"use client"

import * as React from "react"
import { FileText, Download, Eye, X, Tag as TagIcon, Plus } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import type { Document } from "./RepositoryTable"

interface DocumentDetailPanelProps {
  open: boolean
  onClose: () => void
  document: Document | null
}

const mockAllTags = [
  { id: "t1", name: "Priority", color: "#EF4444" },
  { id: "t2", name: "For Review", color: "#F59E0B" },
  { id: "t3", name: "Finalized", color: "#10B981" },
  { id: "t4", name: "Archived", color: "#64748B" },
]

export function DocumentDetailPanel({ open, onClose, document }: DocumentDetailPanelProps) {
  const [showTagAdd, setShowTagAdd] = React.useState(false)

  if (!document) return null

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-[480px] sm:max-w-[480px] overflow-y-auto bg-[#F8FAFC]">
        <SheetHeader className="mb-6">
          <div className="flex items-start justify-between pr-6">
            <SheetTitle className="text-xl font-bold text-slate-900 leading-tight">
              {document.title}
            </SheetTitle>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={document.status} />
            <span className="text-xs text-slate-400 bg-white border px-2 py-0.5 rounded-full">
              ID: {document.id}
            </span>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* File Preview */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{document.title.replace(/\s+/g, "_")}.pdf</p>
                <p className="text-xs text-slate-500">2.4 MB</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <Button variant="outline" size="sm" className="h-8 text-xs text-blue-600">
                <Eye className="w-3.5 h-3.5 mr-1" /> Preview
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs text-emerald-600">
                <Download className="w-3.5 h-3.5 mr-1" /> Download
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Metadata</h3>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Area</span>
              <span className="col-span-2 text-sm text-slate-700 font-medium">Area {document.area.number}: {document.area.name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Criterion</span>
              <span className="col-span-2 text-sm text-slate-700 font-medium">{document.criterion}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Faculty</span>
              <span className="col-span-2 text-sm text-slate-700 font-medium">{document.faculty}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Uploaded</span>
              <span className="col-span-2 text-sm text-slate-700 font-medium">{document.uploadedAt}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-slate-400" /> Tags
              </h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600" onClick={() => setShowTagAdd(!showTagAdd)}>
                <Plus className="w-3 h-3 mr-1" /> Add Tag
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {document.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color, border: `1px solid ${tag.color}40` }}
                >
                  {tag.name}
                  <button className="hover:bg-black/10 rounded-full p-0.5 ml-1 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {document.tags.length === 0 && (
                <span className="text-sm text-slate-400 italic">No tags added.</span>
              )}
            </div>

            {showTagAdd && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-2">Select a tag to add:</p>
                <div className="flex flex-wrap gap-2">
                  {mockAllTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: `${tag.color}10`, color: tag.color, border: `1px solid ${tag.color}30` }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
