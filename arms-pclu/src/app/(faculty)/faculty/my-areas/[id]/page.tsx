"use client"

import * as React from "react"
import { Upload, FileText, CheckCircle, AlertCircle, ChevronLeft } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Skeleton } from "@/components/ui/skeleton"
import { SubmissionUploadForm } from "@/components/submissions/SubmissionUploadForm"
import { useAreas } from "@/hooks/useAreas"
import { useAssignments } from "@/hooks/useAssignments"
import { useMySubmissions } from "@/hooks/useSubmissions"
import { useAuthStore } from "@/store/authStore"
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
              <div className="p-5 flex gap-6">
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-32 w-96 rounded-lg" />
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

      <div className="space-y-6">
        {visibleCriteria.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p>You have no criteria assigned in this area.</p>
          </div>
        ) : (
          visibleCriteria.map((criterion) => (
            <div key={criterion.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 text-lg">{criterion.name}</h3>
                <span className="text-xs font-medium bg-white px-2.5 py-1 rounded-full text-slate-500 border border-slate-200 shadow-sm">
                  {criterion.indicators.length} Indicators
                </span>
              </div>
              
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

                  return (
                    <div key={ind.id} className="p-5 flex flex-col lg:flex-row gap-6 hover:bg-slate-50/50 transition-colors">
                      {/* Indicator Details */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-slate-400 mt-0.5">{index + 1}.</span>
                          <div>
                            <p className="font-medium text-slate-800">{ind.name}</p>
                            <p className="text-sm text-slate-500 mt-1.5 flex flex-col gap-1">
                              <span className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-600">Required:</span> 
                                {ind.requiredDocs || "Any supporting document"}
                              </span>
                              <span className="flex items-center gap-1.5 text-xs">
                                <span className="font-semibold text-slate-600">Scale:</span> 
                                1-{ind.ratingScale}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Submission Status & Action */}
                      <div className="w-full lg:w-96 shrink-0 bg-white rounded-lg p-4 border border-slate-200 shadow-sm flex flex-col gap-3">
                        {indSubmissions.length > 0 ? (
                          <>
                            {indSubmissions.map((submission) => (
                              <div key={submission.id} className="flex flex-col border border-slate-100 rounded-md p-3 bg-slate-50/50">
                                <div className="flex justify-between items-start mb-2 gap-2">
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <FileText className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-sm font-medium text-slate-700 truncate" title={submission.document.title}>
                                        {submission.document.title}
                                      </span>
                                      {submission.document.fileName && (
                                        <span className="text-xs text-slate-400 truncate" title={submission.document.fileName}>
                                          {submission.document.fileName}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <StatusBadge status={submission.status} size="sm" />
                                </div>
                                
                                {submission.status === "RETURNED" && submission.remarks && (
                                  <div className="mt-1 bg-red-50 text-red-700 text-[10px] p-2 rounded border border-red-100 flex items-start gap-1.5 mb-2">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    <span className="font-medium leading-relaxed">{submission.remarks}</span>
                                  </div>
                                )}

                                <div className="mt-2 pt-2 border-t border-slate-200/50">
                                  {submission.status === "APPROVED" ? (
                                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 font-medium py-1">
                                      <CheckCircle className="w-3.5 h-3.5" /> Approved
                                    </div>
                                  ) : (
                                    <Button 
                                      variant="outline"
                                      size="sm"
                                      className="w-full text-xs h-7"
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
                                      {submission.status === "DRAFT" ? "Continue Draft" : "Update Evidence"}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            {needsSubmission && (
                              <div className="mt-2 pt-2 border-t border-slate-100">
                                <Button 
                                  className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 shadow-sm text-xs h-8"
                                  onClick={() => setUploadModalData({
                                    indicator: ind,
                                    areaName: area.name,
                                    criterionName: criterion.name,
                                    existingSubmission: null
                                  })}
                                >
                                  <Upload className="w-3.5 h-3.5 mr-1.5" /> Add Another Evidence
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col h-full items-center justify-center text-center space-y-4 py-2">
                            <div className="text-sm text-amber-600 font-medium flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                              <AlertCircle className="w-4 h-4" /> Needs Submission
                            </div>
                            <Button 
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                              onClick={() => setUploadModalData({
                                indicator: ind,
                                areaName: area.name,
                                criterionName: criterion.name,
                                existingSubmission: null
                              })}
                            >
                              <Upload className="w-4 h-4 mr-2" /> Upload Evidence
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
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
