"use client"

import * as React from "react"
import Link from "next/link"
import { FileText, Clock, AlertCircle, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/dashboard/StatCard"
import { LogbookCard } from "@/components/logbook/LogbookCard"
import { useLogbook } from "@/hooks/useLogbook"
import { useAuthStore } from "@/store/authStore"
import { useAssignments } from "@/hooks/useAssignments"
import { useAreas } from "@/hooks/useAreas"
import { useMySubmissions } from "@/hooks/useSubmissions"

export default function FacultyDashboardPage() {
  const { user } = useAuthStore()
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const { data: logbook = [], isLoading: isLogbookLoading } = useLogbook()
  const { data: assignments = [], isLoading: isAssignmentsLoading } = useAssignments(user?.id ?? "")
  const { data: areas = [] } = useAreas()
  const { data: submissions = [] } = useMySubmissions()

  const pendingCount = logbook.filter(e => e.status === "PENDING" && e.type === "INCOMING").length

  // Calculate stats based on live data
  const myAreasCount = new Set(assignments.map(a => a.areaId)).size
  const underReviewCount = submissions.filter(s => s.status === "SUBMITTED").length

  // Calculate total indicators assigned
  let totalIndicators = 0
  let approvedIndicators = 0
  let submittedIndicators = 0

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
    return Array.from(map.values()).sort((a, b) => a.areaOrder - b.areaOrder)
  }, [assignments])

  groupedAssignments.forEach(group => {
    const fullArea = areas.find(a => a.id === group.areaId)
    if (fullArea) {
      fullArea.criteria.forEach(c => {
        if (group.criteriaAssigned.length === 0 || group.criteriaAssigned.some(assigned => assigned.id === c.id)) {
          totalIndicators += c.indicators.length
          c.indicators.forEach(ind => {
            const hasApproved = submissions.some(sub => sub.indicator.id === ind.id && sub.status === "APPROVED")
            const hasSubmitted = submissions.some(sub => sub.indicator.id === ind.id && sub.status === "SUBMITTED")
            if (hasApproved) approvedIndicators++
            if (hasSubmitted) submittedIndicators++
          })
        }
      })
    }
  })

  // Pending = Assigned indicators that are not yet approved or submitted
  const pendingDocsCount = Math.max(0, totalIndicators - (approvedIndicators + submittedIndicators))
  const completionRate = totalIndicators === 0 ? 0 : Math.round((approvedIndicators / totalIndicators) * 100)

  return (
    <>
      <PageHeader
        title="Faculty Portal"
        subtitle={`Welcome back, ${user?.name ?? "Faculty"}`}
        actions={<span className="text-sm text-slate-500 font-medium">{currentDate}</span>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="My Areas"
          value={myAreasCount}
          subtitle="Assigned PACUCOA areas"
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Pending Documents"
          value={pendingDocsCount}
          subtitle="Needs submission"
          icon={AlertCircle}
          color="rose"
        />
        <StatCard
          title="Under Review"
          value={underReviewCount}
          subtitle="Awaiting admin approval"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          subtitle="My overall progress"
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="text-base font-semibold text-slate-800">My Active Assignments</h3>
          </div>
          <div className="flex-1 p-5 overflow-y-auto space-y-3">
            {isAssignmentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-3 mb-2">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : groupedAssignments.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-10">No active assignments.</div>
            ) : (
              groupedAssignments.slice(0, 3).map((group) => {
                const number = group.areaOrder + 1

                // Quick localized completion calculation for this specific card
                let localTotal = 0
                let localApproved = 0
                const fullArea = areas.find(a => a.id === group.areaId)
                if (fullArea) {
                  fullArea.criteria.forEach(c => {
                    if (group.criteriaAssigned.length === 0 || group.criteriaAssigned.some(assigned => assigned.id === c.id)) {
                      localTotal += c.indicators.length
                      c.indicators.forEach(ind => {
                        if (submissions.some(sub => sub.indicator.id === ind.id && sub.status === "APPROVED")) {
                          localApproved++
                        }
                      })
                    }
                  })
                }
                const localCompletion = localTotal === 0 ? 0 : Math.round((localApproved / localTotal) * 100)

                return (
                <div key={group.areaId} className="border border-slate-200 rounded-lg p-3 hover:border-blue-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {number}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">
                        {group.areaName}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {group.criteriaAssigned.length === 0 ? "All Criteria" : `${group.criteriaAssigned.length} Criteria Assigned`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="text-slate-500">Progress: {localCompletion}%</span>
                    <div className="w-1/2 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${localCompletion}%` }} />
                    </div>
                  </div>
                </div>
              )})
            )}
          </div>
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
            <Link href="/faculty/my-areas" className="text-xs text-blue-600 hover:underline font-medium">
              View all assignments
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="text-base font-semibold text-slate-800">Recent Logbook Entries</h3>
            {pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs py-0.5 px-2 rounded-full font-bold">
                {pendingCount} Action{pendingCount !== 1 ? 's' : ''} Required
              </span>
            )}
          </div>
          <div className="flex-1 p-5 overflow-y-auto space-y-3">
            {isLogbookLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : logbook.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm">
                No recent entries.
              </div>
            ) : (
              logbook.slice(0, 3).map((entry) => (
                <LogbookCard 
                  key={entry.id}
                  role="faculty"
                  entry={entry}
                />
              ))
            )}
          </div>
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
            <Link href="/faculty/logbook" className="text-xs text-blue-600 hover:underline font-medium">
              View full logbook
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
