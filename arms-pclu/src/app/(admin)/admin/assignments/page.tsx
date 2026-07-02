"use client"

import * as React from "react"
import { PageHeader } from "@/components/shared/PageHeader"
import { FacultyList, type Faculty } from "@/components/assignments/FacultyList"
import { AssignmentPanel } from "@/components/assignments/AssignmentPanel"

import { useFacultyList } from "@/hooks/useAssignments"

export default function AssignmentsPage() {
  const [selectedFaculty, setSelectedFaculty] = React.useState<Faculty | null>(null)
  const { data: faculties = [], isLoading } = useFacultyList()

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
            faculties={faculties}
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
