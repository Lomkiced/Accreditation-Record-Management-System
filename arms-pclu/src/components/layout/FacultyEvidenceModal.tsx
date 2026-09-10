"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AvatarInitials } from "@/components/shared/AvatarInitials"
import { getFacultyApprovedEvidence, FacultyEvidenceItem } from "@/actions/search.actions"
import { FileText, Lock, ExternalLink, Loader2, CheckCircle2, FolderOpen } from "lucide-react"
import { useAuthStore } from "@/store/authStore"

interface FacultyEvidenceModalProps {
  faculty: {
    id: string
    name: string
    email: string
    department: string
    designation: string
  } | null
  open: boolean
  onClose: () => void
}

export function FacultyEvidenceModal({
  faculty,
  open,
  onClose,
}: FacultyEvidenceModalProps) {
  const { user } = useAuthStore()

  const { data: evidence = [], isLoading } = useQuery<FacultyEvidenceItem[]>({
    queryKey: ["faculty-evidence", faculty?.id],
    queryFn: async () => {
      if (!faculty?.id) return []
      const res = await getFacultyApprovedEvidence(faculty.id)
      if ("error" in res && res.error) throw new Error(res.error)
      if ("data" in res && res.data) return res.data
      return []
    },
    enabled: open && !!faculty?.id,
  })

  if (!faculty) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden bg-white shadow-2xl rounded-2xl border-slate-200">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <AvatarInitials name={faculty.name} size="lg" />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-bold text-slate-900 truncate">
                {faculty.name}
              </DialogTitle>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {faculty.department} • {faculty.designation} • {faculty.email}
              </p>
            </div>
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs shrink-0">
              Verified Evidence
            </Badge>
          </div>
        </div>

        {/* Content Body */}
        <div className="max-h-[460px] overflow-y-auto p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Approved Accreditation Evidence ({evidence.length})
            </span>
          </div>

          {isLoading ? (
            <div className="py-14 flex flex-col items-center justify-center text-slate-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-xs">Loading approved documents...</span>
            </div>
          ) : evidence.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6">
              <FolderOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No approved documents</p>
              <p className="text-xs text-slate-400 mt-1">This faculty member has no approved accreditation evidence on record yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {evidence.map((doc: FacultyEvidenceItem) => {
                const isOwner = user?.id === faculty.id
                const isRestricted = doc.isConfidential && !isOwner && user?.role === "FACULTY"

                return (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-slate-900 leading-snug truncate">
                            {doc.title}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {doc.fileName || "Evidence file"} • {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>

                          {/* Mappings pills */}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {doc.mappings.map((m: FacultyEvidenceItem["mappings"][number]) => (
                              <span
                                key={m.id}
                                className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-slate-700"
                              >
                                <span className="font-semibold text-blue-600">{m.areaName}</span>: {m.indicatorName}
                                {m.isConfidential && (
                                  <Lock className="w-2.5 h-2.5 text-rose-600 ml-0.5" />
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Confidential vs Approved Badge */}
                      <div className="shrink-0 flex flex-col items-end gap-1.5 ml-2">
                        {doc.isConfidential ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3 text-rose-600" />
                            Confidential
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                        )}

                        {/* Action: Open or Restricted */}
                        {isRestricted ? (
                          <span className="text-[11px] font-medium text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md flex items-center gap-1 mt-1" title="Confidential document — restricted from peer viewing">
                            <Lock className="w-3 h-3" />
                            Restricted
                          </span>
                        ) : doc.fileUrl ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.fileUrl!, "_blank")}
                            className="h-7 text-xs font-medium text-slate-700 hover:text-blue-600 px-2.5 mt-1"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
