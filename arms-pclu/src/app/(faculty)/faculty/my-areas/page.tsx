"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Input } from "@/components/ui/input"
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

  const isLoading = loadingAssignments || loadingAreas

  return (
    <>
      <PageHeader
        title="My Assigned Areas"
        subtitle="Manage and upload documents for your assigned PACUCOA areas"
      />

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search assigned areas..." 
              className="pl-9 h-9" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
            Loading your assignments...
          </div>
        ) : groupedAssignments.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
            You have no assigned areas matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {groupedAssignments.map((group) => {
              const number = group.areaOrder + 1
              const colorClass = COLORS[(number - 1) % COLORS.length]
              
              // Calculate completion
              let totalIndicators = 0
              let approvedIndicators = 0

              const fullArea = areas.find(a => a.id === group.areaId)
              if (fullArea) {
                fullArea.criteria.forEach(c => {
                  // Only count if assigned all criteria OR this specific criterion
                  if (group.criteriaAssigned.length === 0 || group.criteriaAssigned.some(assigned => assigned.id === c.id)) {
                    totalIndicators += c.indicators.length
                    c.indicators.forEach(ind => {
                      // Check if there's an APPROVED mapping for this indicator in my submissions
                      const isApproved = submissions.some(sub => sub.indicator.id === ind.id && sub.status === "APPROVED")
                      if (isApproved) approvedIndicators++
                    })
                  }
                })
              }

              const completion = totalIndicators === 0 ? 0 : Math.round((approvedIndicators / totalIndicators) * 100)
              
              return (
                <Link key={group.areaId} href={`/faculty/my-areas/${group.areaId}`} className="block">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 hover:border-blue-300 group h-full flex flex-col">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${colorClass}`}>
                        {number}
                      </div>
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
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Assigned Scope:</p>
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
    </>
  )
}
