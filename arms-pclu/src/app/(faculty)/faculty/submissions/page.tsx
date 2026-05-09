"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SubmissionsTable, type Submission } from "@/components/submissions/SubmissionsTable"
import { SubmissionReviewPanel } from "@/components/submissions/SubmissionReviewPanel"

const mockMySubmissions: Submission[] = [
  { id: "1", title: "Faculty Development Plan 2024", faculty: "Dr. Juan Perez", area: { number: 2, name: "Faculty" }, criterion: "A. Academic Qualifications", submittedAt: "Oct 12, 2024", version: 2, status: "PENDING" },
  { id: "2", title: "Faculty Profile Forms", faculty: "Dr. Juan Perez", area: { number: 2, name: "Faculty" }, criterion: "A. Academic Qualifications", submittedAt: "Oct 10, 2024", version: 1, status: "APPROVED" },
]

export default function FacultySubmissionsPage() {
  const [selectedSubmission, setSelectedSubmission] = React.useState<Submission | null>(null)

  return (
    <>
      <PageHeader
        title="My Submissions"
        subtitle="Track the status of all your uploaded documents"
      />

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Search by title or criterion..." className="pl-9 h-9" />
          </div>
          <Button variant="outline" size="sm" className="h-9 text-slate-600 bg-slate-50">Status Filter</Button>
          <Button variant="outline" size="sm" className="h-9 text-slate-600 bg-slate-50">Date Range</Button>
        </div>

        <SubmissionsTable 
          data={mockMySubmissions} 
          onRowClick={setSelectedSubmission}
        />
      </div>

      <SubmissionReviewPanel 
        open={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        submission={selectedSubmission ? { ...selectedSubmission, status: selectedSubmission.status === "PENDING" ? "UNDER_REVIEW" : selectedSubmission.status } : null}
      />
    </>
  )
}
