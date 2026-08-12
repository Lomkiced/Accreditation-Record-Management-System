"use client"

import * as React from "react"
import { Search, Archive, Clock, CheckCircle, XCircle } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SubmissionsTable } from "@/components/submissions/SubmissionsTable"
import { SubmissionReviewPanel } from "@/components/submissions/SubmissionReviewPanel"
import { useAllSubmissions } from "@/hooks/useSubmissions"
import type { AdminSubmission } from "@/actions/submission.actions"

export default function SubmissionsPage() {
  const [activeTab, setActiveTab] = React.useState("ALL")
  const [selectedSubmission, setSelectedSubmission] = React.useState<AdminSubmission | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterArea, setFilterArea] = React.useState("ALL")
  const [filterCriterion, setFilterCriterion] = React.useState("ALL")
  const [filterFaculty, setFilterFaculty] = React.useState("ALL")
  
  const { data: submissions = [], isLoading } = useAllSubmissions()
  
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === "SUBMITTED" || s.status === "UNDER_REVIEW").length,
    approved: submissions.filter(s => s.status === "APPROVED").length,
    returned: submissions.filter(s => s.status === "RETURNED").length,
  }

  const filtered = submissions.filter(s => {
    // 1. Tab filter
    if (activeTab === "SUBMITTED" && s.status !== "SUBMITTED" && s.status !== "UNDER_REVIEW") return false
    if (activeTab !== "ALL" && activeTab !== "SUBMITTED" && s.status !== activeTab) return false
    
    // 2. Dropdown filters
    if (filterArea !== "ALL" && s.indicator.criterion.area.name !== filterArea) return false
    if (filterCriterion !== "ALL" && s.indicator.criterion.name !== filterCriterion) return false
    if (filterFaculty !== "ALL" && s.user.name !== filterFaculty) return false
    
    // 3. Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!s.document.title.toLowerCase().includes(q) && 
          !s.user.name.toLowerCase().includes(q)) {
        return false
      }
    }
    return true
  })

  // Compute unique values for dropdowns
  const uniqueAreas = Array.from(new Set(submissions.map(s => s.indicator.criterion.area.name))).sort()
  const uniqueCriteria = Array.from(new Set(submissions.map(s => s.indicator.criterion.name))).sort()
  const uniqueFaculties = Array.from(new Set(submissions.map(s => s.user.name))).sort()

  return (
    <>
      <PageHeader
        title="Document Submissions"
        subtitle="Review and manage faculty document submissions"
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 px-4 py-2 flex items-center gap-2 shadow-sm w-36 h-10 animate-pulse">
                <div className="w-4 h-4 rounded-full bg-slate-200"></div>
                <div className="h-4 bg-slate-200 rounded w-16"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm h-[600px] flex flex-col items-center justify-center">
             <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
             <p className="mt-4 text-slate-500 font-medium text-sm animate-pulse">Loading submissions...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="bg-white rounded-lg border border-slate-200 px-4 py-2 flex items-center gap-2 shadow-sm">
            <Archive className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">{stats.total} Total</span>
          </div>
          <div className="bg-amber-50 border-amber-200 rounded-lg border px-4 py-2 flex items-center gap-2 shadow-sm">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-700">{stats.pending} Pending Review</span>
          </div>
          <div className="bg-emerald-50 border-emerald-200 rounded-lg border px-4 py-2 flex items-center gap-2 shadow-sm">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-700">{stats.approved} Approved</span>
          </div>
          <div className="bg-red-50 border-red-200 rounded-lg border px-4 py-2 flex items-center gap-2 shadow-sm">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700">{stats.returned} Returned</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-6 border-b border-slate-200 mb-4 pb-2">
            {["ALL", "SUBMITTED", "APPROVED", "RETURNED", "DRAFT"].map(tab => (
              <button
                key={tab}
                className={`text-sm font-medium pb-2 -mb-[9px] px-1 border-b-2 transition-colors ${
                  activeTab === tab 
                    ? "text-blue-600 border-blue-600" 
                    : "text-slate-500 border-transparent hover:text-slate-700"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "SUBMITTED" ? "Pending Review" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search by title or faculty..." 
                className="pl-9 h-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-400"
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
            >
              <option value="ALL">All Areas</option>
              {uniqueAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <select 
              className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-400"
              value={filterCriterion}
              onChange={(e) => setFilterCriterion(e.target.value)}
            >
              <option value="ALL">All Criterias</option>
              {uniqueCriteria.map(crit => (
                <option key={crit} value={crit}>{crit}</option>
              ))}
            </select>
            <select 
              className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-400"
              value={filterFaculty}
              onChange={(e) => setFilterFaculty(e.target.value)}
            >
              <option value="ALL">All Faculties</option>
              {uniqueFaculties.map(fac => (
                <option key={fac} value={fac}>{fac}</option>
              ))}
            </select>
            
            <div className="ml-auto text-sm text-slate-500">
              {filtered.length} results
            </div>
          </div>
        </div>
        <SubmissionsTable data={filtered} onRowClick={setSelectedSubmission} />
        </div>
      )}
      <SubmissionReviewPanel 
        open={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        submission={selectedSubmission}
      />
    </>
  )
}
