"use client"

import * as React from "react"
import { PageHeader } from "@/components/shared/PageHeader"
import { FacultyList, type Faculty } from "@/components/assignments/FacultyList"
import { AssignmentPanel } from "@/components/assignments/AssignmentPanel"

const mockFaculties: Faculty[] = [
  { id: "1", name: "Dr. Juan Perez", department: "Computer Science", designation: "Dean", assignedCount: 2 },
  { id: "2", name: "Maria Clara", department: "Information Tech", designation: "Professor", assignedCount: 1 },
  { id: "3", name: "Pedro Penduko", department: "Computer Science", designation: "Instructor", assignedCount: 0 },
  { id: "4", name: "Elena Santos", department: "Information Systems", designation: "Associate Prof", assignedCount: 3 },
]

export default function AssignmentsPage() {
  const [selectedFaculty, setSelectedFaculty] = React.useState<Faculty | null>(null)

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-120px)]">
      <div className="shrink-0">
        <PageHeader
          title="Area Assignments"
          subtitle="Assign PACUCOA areas and criteria to faculty members"
        />
      </div>

      <div className="grid grid-cols-5 gap-4 flex-1 min-h-0">
        <div className="col-span-2">
          <FacultyList 
            faculties={mockFaculties}
            selectedId={selectedFaculty?.id || null}
            onSelect={setSelectedFaculty}
          />
        </div>
        
        <div className="col-span-3">
          <AssignmentPanel selectedFaculty={selectedFaculty} />
        </div>
      </div>
    </div>
  )
}
