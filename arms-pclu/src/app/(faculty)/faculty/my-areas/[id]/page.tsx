"use client"

import * as React from "react"
import { Upload, FileText, CheckCircle, AlertCircle, ChevronLeft, ChevronDown, Eye } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Skeleton } from "@/components/ui/skeleton"
import { SubmissionUploadForm } from "@/components/submissions/SubmissionUploadForm"
import { useAreas } from "@/hooks/useAreas"
import { useAssignments } from "@/hooks/useAssignments"
import { useMySubmissions } from "@/hooks/useSubmissions"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function MyAreaDetailPage({ params }: { params: { id: string } }) {
  const areaId = params.id
  const { user } = useAuthStore()

  // Queries
  const { data: areas = [], isLoading: loadingAreas } = useAreas()
  const { data: assignments = [], isLoading: loadingAssignments } = useAssignments(user?.id ?? "")
  const { data: submissions = [], isLoading: loadingSubmissions } = useMySubmissions()

  const isLoading = loadingAreas || loadingAssignments || loadingSubmissions

  // State for Upload Modal
  const [uploadModalData, setUploadModalData] = React.useState<{
    indicator: any
    areaName: string
    criterionName: string
    existingSubmission: any | null
  } | null>(null)

  // Collapsible criteria state
  const [expandedCriteria, setExpandedCriteria] = React.useState<Set<string>>(new Set())

  const toggleCriterion = (id: string) => {
    setExpandedCriteria(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // 1. Find the specific Area
  const area = areas.find((a) => a.id === areaId)

  const visibleCriteria = React.useMemo(() => {
    if (!area) return []
    
    const areaAssignments = assignments.filter((a) => a.areaId === areaId)
    const isAssignedWholeArea = areaAssignments.some((a) => !a.criterionId)
    
    if (isAssignedWholeArea) return area.criteria
    
    const assignedCriteriaIds = new Set(
      areaAssignments.filter((a) => a.criterionId).map((a) => a.criterionId)
    )
    return area.criteria.filter((c) => assignedCriteriaIds.has(c.id))
  }, [area, assignments, areaId])

  // Expand all criteria by default on first load
  React.useEffect(() => {
    if (visibleCriteria.length > 0 && expandedCriteria.size === 0) {
      setExpandedCriteria(new Set(visibleCriteria.map(c => c.id)))
    }
  }, [visibleCriteria]) // eslint-disable-line react-hooks/exhaustive-deps

  // Area-level stats
  const areaStats = React.useMemo(() => {
    let total = 0, approved = 0, submitted = 0, needsAction = 0
    visibleCriteria.forEach(c => {
      c.indicators.forEach(ind => {
        let reqCount = 1
        if (ind.requiredDocs) {
          if (!isNaN(Number(ind.requiredDocs))) {
            reqCount = Math.max(1, Number(ind.requiredDocs))
          } else {
            reqCount = ind.requiredDocs.split(',').filter(s => s.trim().length > 0).length || 1
          }
        }
        total += reqCount
        const approvedCount = submissions.filter(sub => sub.indicator.id === ind.id && sub.status === "APPROVED").length
        const submittedCount = submissions.filter(sub => sub.indicator.id === ind.id && (sub.status === "SUBMITTED" || sub.status === "UNDER_REVIEW")).length
        approved += Math.min(approvedCount, reqCount)
        submitted += Math.min(submittedCount, reqCount)
        const activeCount = submissions.filter(s => s.indicator.id === ind.id && s.status !== "RETURNED" && s.status !== "DRAFT").length
        if (activeCount < reqCount) needsAction++
      })
    })
    const percent = total === 0 ? 0 : Math.round((approved / total) * 100)
    return { total, approved, submitted, needsAction, percent }
  }, [visibleCriteria, submissions])

  if (isLoading) {
    return (
      <div className="flex-1 w-full flex flex-col gap-6 p-6 max-w-[1200px] mx-auto">
        <Skeleton className="h-10 w-64 mb-4" />
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <Skeleton className="h-6 w-1/3" />
              </div>
              <div className="p-5 space-y-4">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!area) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Area not found</h2>
        <p className="text-slate-500 mt-2 text-center max-w-md">
          This area doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/faculty/my-areas">
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to My Areas
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title={area.name}
        breadcrumbs={[
          { label: "My Areas", href: "/faculty/my-areas" },
          { label: area.name },
        ]}
      />

      {/* Area Summary Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-black text-slate-800">{areaStats.percent}%</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Complete</p>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-600">{areaStats.approved} Approved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs font-semibold text-slate-600">{areaStats.submitted} Under Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-xs font-semibold text-slate-600">{areaStats.total} Total</span>
              </div>
            </div>
          </div>
          {areaStats.needsAction > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">{areaStats.needsAction} indicators need evidence</span>
            </div>
          )}
        </div>
        <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${areaStats.percent}%` }} />
          <div className="h-full bg-blue-400 transition-all duration-700" style={{ width: `${areaStats.total === 0 ? 0 : Math.round((areaStats.submitted / areaStats.total) * 100)}%` }} />
        </div>
      </div>

      <div className="space-y-4">
        {visibleCriteria.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p>You have no criteria assigned in this area.</p>
          </div>
        ) : (
          visibleCriteria.map((criterion) => {
            const isExpanded = expandedCriteria.has(criterion.id)
            const critApproved = criterion.indicators.filter(ind => 
              submissions.some(sub => sub.indicator.id === ind.id && sub.status === "APPROVED")
            ).length
            const critTotal = criterion.indicators.length

            return (
              <div key={criterion.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Criterion Header */}
                <button
                  onClick={() => toggleCriterion(criterion.id)}
                  className="w-full p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center hover:bg-slate-100/80 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <ChevronDown className={cn(
                      "w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0",
                      !isExpanded && "-rotate-90"
                    )} />
                    <h3 className="font-semibold text-slate-800 text-[15px] truncate">{criterion.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={cn(
                      "text-xs font-bold px-2.5 py-1 rounded-full",
                      critApproved === critTotal && critTotal > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    )}>
                      {critApproved}/{critTotal} Complete
                    </span>
                  </div>
                </button>
                
                {/* Indicators List */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100">
                    {criterion.indicators.map((ind, index) => {
                      // Find the user's submissions for this exact indicator
                      const indSubmissions = submissions.filter(sub => sub.indicator.id === ind.id)
                      
                      // Calculate required docs
                      let reqCount = 1;
                      if (ind.requiredDocs) {
                        if (!isNaN(Number(ind.requiredDocs))) {
                          reqCount = Math.max(1, Number(ind.requiredDocs));
                        } else {
                          reqCount = ind.requiredDocs.split(',').filter(s => s.trim().length > 0).length || 1;
                        }
                      }
                      
                      const activeCount = indSubmissions.filter(s => s.status !== "RETURNED" && s.status !== "DRAFT").length;
                      const needsSubmission = activeCount < reqCount;
                      const hasApproved = indSubmissions.some(s => s.status === "APPROVED")

                      return (
                        <div key={ind.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                          {/* Indicator Header Row */}
                          <div className="flex items-start gap-3 mb-3">
                            <span className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                              hasApproved 
                                ? "bg-emerald-100 text-emerald-700" 
                                : needsSubmission 
                                  ? "bg-amber-100 text-amber-700" 
                                  : "bg-blue-100 text-blue-700"
                            )}>
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 text-sm leading-snug">{ind.name}</p>
                              {ind.requiredDocs && (
                                <p className="text-xs text-slate-400 mt-1">
                                  <span className="font-semibold text-slate-500">Required:</span> {ind.requiredDocs}
                                </p>
                              )}
                            </div>
                            {/* Quick Upload Button */}
                            {needsSubmission && (
                              <Button 
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 shrink-0"
                                onClick={() => setUploadModalData({
                                  indicator: ind,
                                  areaName: area.name,
                                  criterionName: criterion.name,
                                  existingSubmission: null
                                })}
                              >
                                <Upload className="w-3.5 h-3.5 mr-1.5" />
                                Upload
                              </Button>
                            )}
                          </div>

                          {/* Submissions List - Compact inline rows */}
                          {indSubmissions.length > 0 && (
                            <div className="ml-10 space-y-2">
                              {indSubmissions.map((submission) => (
                                <div key={submission.id} className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
                                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-700 truncate" title={submission.document.title}>
                                      {submission.document.title}
                                    </p>
                                    {submission.document.fileName && (
                                      <p className="text-[11px] text-slate-400 truncate">{submission.document.fileName}</p>
                                    )}
                                  </div>
                                  <StatusBadge status={submission.status} size="sm" />
                                  
                                  {/* Action Button */}
                                  {submission.status === "APPROVED" ? (
                                    <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium shrink-0">
                                      <CheckCircle className="w-3.5 h-3.5" />
                                    </div>
                                  ) : (
                                    <Button 
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-7 px-2 text-slate-500 hover:text-blue-600 shrink-0"
                                      onClick={() => setUploadModalData({
                                        indicator: ind,
                                        areaName: area.name,
                                        criterionName: criterion.name,
                                        existingSubmission: {
                                          id: submission.documentId,
                                          title: submission.document.title,
                                          description: submission.document.description,
                                          status: submission.status,
                                          version: submission.document.version,
                                          versions: (submission.document.versions || []).map((v: any) => ({
                                            version: v.version,
                                            fileUrl: v.fileUrl,
                                            fileName: v.fileName,
                                            createdAt: v.createdAt.toString(),
                                            status: submission.status,
                                            remarks: v.remarks
                                          }))
                                        }
                                      })}
                                    >
                                      {submission.status === "DRAFT" ? "Continue" : "Update"}
                                    </Button>
                                  )}
                                </div>
                              ))}

                              {/* Returned remarks shown inline */}
                              {indSubmissions.filter(s => s.status === "RETURNED" && s.remarks).map(s => (
                                <div key={`remark-${s.id}`} className="flex items-start gap-2 bg-red-50 text-red-700 text-xs p-2.5 rounded-lg border border-red-100 ml-0">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <span className="font-medium leading-relaxed">{s.remarks}</span>
                                </div>
                              ))}

                              {/* Add Another Evidence */}
                              {needsSubmission && indSubmissions.length > 0 && (
                                <button
                                  onClick={() => setUploadModalData({
                                    indicator: ind,
                                    areaName: area.name,
                                    criterionName: criterion.name,
                                    existingSubmission: null
                                  })}
                                  className="w-full flex items-center justify-center gap-1.5 p-2 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 border-dashed transition-colors"
                                >
                                  <Upload className="w-3 h-3" />
                                  Add Another Evidence
                                </button>
                              )}
                            </div>
                          )}

                          {/* Empty state — No submissions yet */}
                          {indSubmissions.length === 0 && (
                            <div className="ml-10">
                              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                <span className="text-xs font-medium text-amber-700">No evidence uploaded yet</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <SubmissionUploadForm 
        open={!!uploadModalData}
        onClose={() => setUploadModalData(null)}
        indicator={uploadModalData?.indicator || null}
        areaName={uploadModalData?.areaName || ""}
        criterionName={uploadModalData?.criterionName || ""}
        existingSubmission={uploadModalData?.existingSubmission || null}
      />
    </>
  )
}

