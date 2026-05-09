"use client"

import * as React from "react"
import { Search, Archive, Clock, CheckCircle, XCircle } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SubmissionsTable, type Submission } from "@/components/submissions/SubmissionsTable"
import { SubmissionReviewPanel } from "@/components/submissions/SubmissionReviewPanel"

const mockSubmissions: Submission[] = [
  { id: "1", title: "Faculty Development Plan 2024", faculty: "Dr. Juan Perez", area: { number: 2, name: "Faculty" }, criterion: "A. Academic Qualifications", submittedAt: "Oct 12, 2024", version: 2, status: "PENDING" },
  { id: "2", title: "Library Holdings Inventory", faculty: "Maria Clara", area: { number: 4, name: "Library" }, criterion: "B. Collection", submittedAt: "Oct 11, 2024", version: 1, status: "APPROVED" },
  { id: "3", title: "Course Syllabus CS101", faculty: "Pedro Penduko", area: { number: 3, name: "Instruction" }, criterion: "C. Program of Studies", submittedAt: "Oct 10, 2024", version: 1, status: "RETURNED" },
  { id: "4", title: "Alumni Tracer Study Results", faculty: "Elena Santos", area: { number: 7, name: "Student Services" }, criterion: "D. Alumni", submittedAt: "Oct 09, 2024", version: 1, status: "DRAFT" },
]

export default function SubmissionsPage() {
  const [activeTab, setActiveTab] = React.useState("ALL")
  const [selectedSubmission, setSelectedSubmission] = React.useState<Submission | null>(null)
  
  const stats = {
    total: mockSubmissions.length,
    pending: mockSubmissions.filter(s => s.status === "PENDING").length,
    approved: mockSubmissions.filter(s => s.status === "APPROVED").length,
    returned: mockSubmissions.filter(s => s.status === "RETURNED").length,
  }

  const filtered = activeTab === "ALL" 
    ? mockSubmissions 
    : mockSubmissions.filter(s => s.status === activeTab)

  return (
    <>
      <PageHeader
        title="Document Submissions"
        subtitle="Review and manage faculty document submissions"
      />

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
            {["ALL", "PENDING", "APPROVED", "RETURNED", "DRAFT"].map(tab => (
              <button
                key={tab}
                className={`text-sm font-medium pb-2 -mb-[9px] px-1 border-b-2 transition-colors ${
                  activeTab === tab 
                    ? "text-blue-600 border-blue-600" 
                    : "text-slate-500 border-transparent hover:text-slate-700"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "PENDING" ? "Pending Review" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search by title or faculty..." className="pl-9 h-9" />
            </div>
            <Button variant="outline" className="h-9 text-slate-600">Area</Button>
            <Button variant="outline" className="h-9 text-slate-600">Criterion</Button>
            <Button variant="outline" className="h-9 text-slate-600">Faculty</Button>
            
            <div className="ml-auto text-sm text-slate-500">
              {filtered.length} results
            </div>
          </div>
        </div>
        <SubmissionsTable data={filtered} onRowClick={setSelectedSubmission} />
      </div>
      <SubmissionReviewPanel 
        open={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        submission={selectedSubmission}
      />
    </>
  )
}
