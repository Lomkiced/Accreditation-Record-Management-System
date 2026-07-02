"use client"

import * as React from "react"
import { FileText, Download, Eye, CheckCircle, CornerUpLeft } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { VersionHistory } from "./VersionHistory"
import { AdminSubmission } from "@/actions/submission.actions"
import { useReviewSubmission } from "@/hooks/useSubmissions"

interface SubmissionReviewPanelProps {
  open: boolean
  onClose: () => void
  submission: AdminSubmission | null
}

export function SubmissionReviewPanel({ open, onClose, submission }: SubmissionReviewPanelProps) {
  const [remarks, setRemarks] = React.useState("")
  const reviewMutation = useReviewSubmission()

  if (!submission) return null

  const isReviewable = submission.status === "SUBMITTED" || submission.status === "UNDER_REVIEW"

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-[480px] sm:max-w-[480px] overflow-y-auto bg-[#F8FAFC]">
        <SheetHeader className="mb-6">
          <div className="flex items-start justify-between pr-6">
            <SheetTitle className="text-xl font-bold text-slate-900 leading-tight">
              {submission.document.title}
            </SheetTitle>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={submission.status} />
            <span className="text-xs text-slate-400 bg-white border px-2 py-0.5 rounded-full">
              v{submission.document.version}
            </span>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Section 1: Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Faculty</span>
              <span className="col-span-2 text-sm text-slate-700 font-medium">{submission.user.name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Area</span>
              <span className="col-span-2 text-sm text-slate-700 font-medium">Area {(submission.indicator.criterion.area.order ?? 0) + 1}: {submission.indicator.criterion.area.name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Criterion</span>
              <span className="col-span-2 text-sm text-slate-700 font-medium">{submission.indicator.criterion.name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Submitted</span>
              <span className="col-span-2 text-sm text-slate-700 font-medium">
                {new Date(submission.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>

            {submission.document.description && (
              <div className="mt-4 bg-slate-50 border-l-4 border-slate-300 p-3 italic text-sm text-slate-600 rounded-r-lg">
                “{submission.document.description}”
              </div>
            )}
          </div>

          {/* Section 2: Document File */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{submission.document.fileName || 'Document'}</p>
                <p className="text-xs text-slate-500">
                  {submission.document.fileSize ? `${(submission.document.fileSize / (1024 * 1024)).toFixed(2)} MB` : 'Unknown size'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              {submission.document.fileUrl && (
                <a href={submission.document.fileUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600 border-blue-200">
                    <Download className="w-4 h-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Section 3: History */}
          <div className="bg-white rounded-xl border border-slate-200 px-4">
            <VersionHistory versions={submission.document.versions.length > 0 ? submission.document.versions.map(v => ({
              version: v.version,
              date: new Date(v.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              status: v.version === submission.document.version ? submission.status : "SUPERSEDED",
              remarks: v.remarks
            })) : [
              { 
                version: submission.document.version, 
                date: new Date(submission.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), 
                status: submission.status, 
                remarks: null 
              }
            ]} />
          </div>

          {/* Section 4: Action */}
          {isReviewable ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm border-t-4 border-t-blue-500">
              <h3 className="text-sm font-semibold text-slate-800">Review Action</h3>
              <Textarea 
                placeholder="Add feedback or remarks (required for return)..." 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="resize-none"
              />
              <div className="flex flex-col gap-2">
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
                  disabled={reviewMutation.isPending}
                  onClick={() => {
                    reviewMutation.mutate(
                      { mappingId: submission.id, status: "APPROVED", remarks },
                      { onSuccess: () => onClose() }
                    )
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Document
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-red-500 text-red-600 hover:bg-red-50" 
                  disabled={reviewMutation.isPending}
                  onClick={() => {
                    reviewMutation.mutate(
                      { mappingId: submission.id, status: "RETURNED", remarks },
                      { onSuccess: () => onClose() }
                    )
                  }}
                >
                  <CornerUpLeft className="w-4 h-4 mr-2" />
                  Return with Remarks
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">Review Information</h3>
              {submission.status === "RETURNED" && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded italic">
                  “{submission.remarks}”
                </div>
              )}
              {submission.status === "APPROVED" && (
                <div className="text-sm text-emerald-600 font-medium">
                  Document has been approved.
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
