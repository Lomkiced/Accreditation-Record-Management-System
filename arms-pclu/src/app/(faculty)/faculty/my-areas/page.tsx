"use client"

import * as React from "react"
import { Search, Upload, ChevronRight, FileText } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SubmissionUploadForm } from "@/components/submissions/SubmissionUploadForm"
import Link from "next/link"
import { cn } from "@/lib/utils"

import { useAuthStore } from "@/store/authStore"
import { useAssignments } from "@/hooks/useAssignments"
import { useAreas } from "@/hooks/useAreas"
import { useMySubmissions } from "@/hooks/useSubmissions"

export default function MyAreasPage() {
  const { user } = useAuthStore()
  const { data: assignments = [], isLoading: loadingAssignments } = useAssignments(user?.id ?? "")
  const { data: areas = [], isLoading: loadingAreas } = useAreas()
  const { data: submissions = [] } = useMySubmissions()
  const [searchQuery, setSearchQuery] = React.useState("")

  // Upload Evidence picker state
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [pickerStep, setPickerStep] = React.useState<"area" | "criterion" | "indicator">("area")
  const [selectedArea, setSelectedArea] = React.useState<string | null>(null)
  const [selectedCriterion, setSelectedCriterion] = React.useState<string | null>(null)

  // Upload form state
  const [uploadModalData, setUploadModalData] = React.useState<{
    indicator: any
    areaName: string
    criterionName: string
    existingSubmission: any | null
  } | null>(null)

  const COLORS = [
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
    "bg-orange-100 text-orange-700",
    "bg-teal-100 text-teal-700",
  ]

  // Group assignments by Area
  const groupedAssignments = React.useMemo(() => {
    const map = new Map<string, {
      areaId: string
      areaName: string
      areaOrder: number
      criteriaAssigned: { id: string, name: string }[]
    }>()

    assignments.forEach(a => {
      if (!map.has(a.areaId)) {
        map.set(a.areaId, {
          areaId: a.areaId,
          areaName: a.area.name,
          areaOrder: a.area.order,
          criteriaAssigned: []
        })
      }
      if (a.criterionId && a.criterion) {
        map.get(a.areaId)!.criteriaAssigned.push({ id: a.criterion.id, name: a.criterion.name })
      }
    })

    return Array.from(map.values()).filter(g => 
      g.areaName.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => a.areaOrder - b.areaOrder)
  }, [assignments, searchQuery])

  // Picker helpers — get criteria for the selected area
  const pickerCriteria = React.useMemo(() => {
    if (!selectedArea) return []
    const group = groupedAssignments.find(g => g.areaId === selectedArea)
    const fullArea = areas.find(a => a.id === selectedArea)
    if (!fullArea || !group) return []

    if (group.criteriaAssigned.length === 0) return fullArea.criteria
    return fullArea.criteria.filter(c => group.criteriaAssigned.some(a => a.id === c.id))
  }, [selectedArea, groupedAssignments, areas])

  const pickerIndicators = React.useMemo(() => {
    if (!selectedCriterion) return []
    const criterion = pickerCriteria.find(c => c.id === selectedCriterion)
    return criterion?.indicators ?? []
  }, [selectedCriterion, pickerCriteria])

  const handleOpenPicker = () => {
    setPickerStep("area")
    setSelectedArea(null)
    setSelectedCriterion(null)
    setPickerOpen(true)
  }

  const handleSelectArea = (areaId: string) => {
    setSelectedArea(areaId)
    setPickerStep("criterion")
  }

  const handleSelectCriterion = (criterionId: string) => {
    setSelectedCriterion(criterionId)
    setPickerStep("indicator")
  }

  const handleSelectIndicator = (indicator: any) => {
    const areaName = groupedAssignments.find(g => g.areaId === selectedArea)?.areaName ?? ""
    const criterionName = pickerCriteria.find(c => c.id === selectedCriterion)?.name ?? ""
    setPickerOpen(false)
    setUploadModalData({
      indicator,
      areaName,
      criterionName,
      existingSubmission: null,
    })
  }

  const handlePickerBack = () => {
    if (pickerStep === "indicator") {
      setSelectedCriterion(null)
      setPickerStep("criterion")
    } else if (pickerStep === "criterion") {
      setSelectedArea(null)
      setPickerStep("area")
    }
  }

  // We only want to show the loading skeleton when the queries are actively fetching data for the first time.
  const isLoading = loadingAssignments || loadingAreas

  return (
    <>
      <PageHeader
        title="My Assigned Areas"
        subtitle="Manage and upload evidence for your assigned PACUCOA areas"
      />

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search assigned areas..." 
              className="pl-9 h-9" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            onClick={handleOpenPicker}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-9 px-4"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Evidence
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 h-64 flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 mb-4 flex-1 space-y-2">
                  <Skeleton className="h-3 w-32 mb-3" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <div className="mt-auto space-y-2">
                   <div className="flex justify-between"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-8" /></div>
                   <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : groupedAssignments.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
            You have no assigned areas matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {groupedAssignments.map((group) => {
              // Calculate completion
              let totalIndicators = 0
              let approvedIndicators = 0

              const fullArea = areas.find(a => a.id === group.areaId)
              if (fullArea) {
                fullArea.criteria.forEach(c => {
                  // Only count if assigned all criteria OR this specific criterion
                  if (group.criteriaAssigned.length === 0 || group.criteriaAssigned.some(assigned => assigned.id === c.id)) {
                    c.indicators.forEach(ind => {
                      let reqCount = 1;
                      if (ind.requiredDocs) {
                        if (!isNaN(Number(ind.requiredDocs))) {
                          reqCount = Math.max(1, Number(ind.requiredDocs));
                        } else {
                          reqCount = ind.requiredDocs.split(',').filter(s => s.trim().length > 0).length || 1;
                        }
                      }
                      totalIndicators += reqCount;
                      const approvedCount = submissions.filter(sub => sub.indicator.id === ind.id && sub.status === "APPROVED").length;
                      approvedIndicators += Math.min(approvedCount, reqCount);
                    })
                  }
                })
              }

              const completion = totalIndicators === 0 ? 0 : Math.round((approvedIndicators / totalIndicators) * 100)
              
              return (
                <Link key={group.areaId} href={`/faculty/my-areas/${group.areaId}`} className="block">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 hover:border-blue-300 group h-full flex flex-col">
                    <div className="flex items-start gap-4 mb-4">

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-lg group-hover:text-blue-600 transition-colors truncate">
                          {group.areaName}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {group.criteriaAssigned.length === 0 ? "All Criteria Assigned" : `${group.criteriaAssigned.length} Criteria Assigned`}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3 mb-4 flex-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Criteria Assigned:</p>
                      <ul className="space-y-1">
                        {group.criteriaAssigned.length === 0 ? (
                           <li className="text-sm text-slate-700 truncate flex items-center gap-2">
                             <span className="w-1 h-1 bg-slate-400 rounded-full shrink-0" />
                             Entire Area
                           </li>
                        ) : group.criteriaAssigned.map((c) => (
                          <li key={c.id} className="text-sm text-slate-700 truncate flex items-center gap-2">
                            <span className="w-1 h-1 bg-slate-400 rounded-full shrink-0" />
                            {c.name}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-auto">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
                        <span>Overall Progress</span>
                        <span>{completion}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${completion}%` }} />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Area/Criterion/Indicator Picker Dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <DialogTitle className="text-base font-semibold text-slate-900">
              Upload Evidence
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-0.5">
              {pickerStep === "area" && "Select an area to continue"}
              {pickerStep === "criterion" && "Select a criterion"}
              {pickerStep === "indicator" && "Select the indicator to upload evidence for"}
            </p>
          </DialogHeader>

          <div className="px-4 py-3">
            {/* Breadcrumb trail */}
            {pickerStep !== "area" && (
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                <button
                  onClick={() => { setSelectedArea(null); setSelectedCriterion(null); setPickerStep("area") }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Areas
                </button>
                {selectedArea && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <button
                      onClick={pickerStep === "indicator" ? handlePickerBack : undefined}
                      className={cn(
                        "text-xs font-medium truncate max-w-[140px]",
                        pickerStep === "indicator" ? "text-blue-600 hover:text-blue-800 cursor-pointer" : "text-slate-700"
                      )}
                    >
                      {groupedAssignments.find(g => g.areaId === selectedArea)?.areaName}
                    </button>
                  </>
                )}
                {selectedCriterion && pickerStep === "indicator" && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[140px]">
                      {pickerCriteria.find(c => c.id === selectedCriterion)?.name}
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="max-h-[360px] overflow-y-auto space-y-1.5">
              {/* Area list */}
              {pickerStep === "area" && groupedAssignments.map((group) => (
                <button
                  key={group.areaId}
                  onClick={() => handleSelectArea(group.areaId)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {group.areaOrder}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                      {group.areaName}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {group.criteriaAssigned.length === 0 ? "All criteria" : `${group.criteriaAssigned.length} criteria`}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}

              {/* Criterion list */}
              {pickerStep === "criterion" && pickerCriteria.map((criterion) => (
                <button
                  key={criterion.id}
                  onClick={() => handleSelectCriterion(criterion.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                      {criterion.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {criterion.indicators.length} indicators
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}

              {/* Indicator list */}
              {pickerStep === "indicator" && pickerIndicators.map((indicator: any, idx: number) => (
                <button
                  key={indicator.id}
                  onClick={() => handleSelectIndicator(indicator)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 leading-snug group-hover:text-emerald-700 transition-colors">
                      {indicator.name}
                    </p>
                    {indicator.requiredDocs && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        Required: {indicator.requiredDocs}
                      </p>
                    )}
                  </div>
                  <Upload className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </button>
              ))}

              {/* Empty states */}
              {pickerStep === "area" && groupedAssignments.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No areas assigned to you.</p>
              )}
              {pickerStep === "criterion" && pickerCriteria.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No criteria found for this area.</p>
              )}
              {pickerStep === "indicator" && pickerIndicators.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No indicators found for this criterion.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Form Sheet */}
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

