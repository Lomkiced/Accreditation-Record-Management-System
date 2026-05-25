"use client"

import * as React from "react"
import {
  Plus,
  FileText,
  UploadCloud,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FilePen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DocumentUploadSheet } from "@/components/documents/DocumentUploadSheet"
import type { DocumentWithMappings } from "@/types/document.types"
import { cn } from "@/lib/utils"

// ─── Status Badge Configuration ────────────────────────────────────────────────
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

function MappingBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap",
        cfg.className
      )}
    >
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface SubmissionsClientProps {
  documents: DocumentWithMappings[]
}

export function SubmissionsClient({ documents }: SubmissionsClientProps) {
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Submissions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your uploaded evidence and view mapping statuses.
          </p>
        </div>
        <Button
          onClick={() => setIsUploadOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Evidence
        </Button>
      </div>

      {/* Main Content Area */}
      {documents.length === 0 ? (
        // Empty State
        <div className="bg-white rounded-xl border border-slate-200 border-dashed p-12 text-center shadow-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No submissions yet
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            You haven't uploaded any documents. Start by uploading your first
            piece of evidence to map it to accreditation indicators.
          </p>
          <Button
            onClick={() => setIsUploadOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Your First Document
          </Button>
        </div>
      ) : (
        // Data Table
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Document Details</th>
                  <th className="px-6 py-4 font-semibold">Mapped Indicators</th>
                  <th className="px-6 py-4 font-semibold text-right">Date Uploaded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => {
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      {/* Column 1: Document Details */}
                      <td className="px-6 py-4 align-top max-w-xs whitespace-normal">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                            <FileText className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-snug">
                              {doc.title}
                            </p>
                            <p className="text-xs text-blue-600 font-medium mt-0.5 truncate max-w-[200px]">
                              {doc.fileName || "No file attached"}
                            </p>
                            {doc.description && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {doc.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Mapped Indicators */}
                      <td className="px-6 py-4 align-top">
                        {doc.mappings.length === 0 ? (
                          <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-md text-xs font-medium">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Untagged (Draft)
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {doc.mappings.map((mapping) => (
                              <div
                                key={mapping.id}
                                className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm w-max max-w-md"
                              >
                                <div className="min-w-0">
                                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                    {mapping.indicator.criterion.area.name}
                                  </p>
                                  <p className="text-xs text-slate-700 font-medium truncate mt-0.5">
                                    {mapping.indicator.name}
                                  </p>
                                </div>
                                <div className="ml-auto shrink-0 pl-4 border-l border-slate-100">
                                  <MappingBadge status={mapping.status} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Column 3: Date Uploaded */}
                      <td className="px-6 py-4 align-top text-right">
                        <p className="text-sm text-slate-600 font-medium">
                          {new Date(doc.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(doc.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Document Upload Sheet Mounting */}
      <DocumentUploadSheet
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  )
}
