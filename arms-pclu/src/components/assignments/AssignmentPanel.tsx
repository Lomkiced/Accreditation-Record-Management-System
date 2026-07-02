"use client"

import * as React from "react"
import { UserCheck, Plus, Trash2, Loader2 } from "lucide-react"
import { AvatarInitials } from "@/components/shared/AvatarInitials"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import type { Faculty } from "./FacultyList"
import { AssignmentModal } from "./AssignmentModal"
import { useAssignments, useDeleteAssignment } from "@/hooks/useAssignments"

interface AssignmentPanelProps {
  selectedFaculty: Faculty | null
}

export function AssignmentPanel({ selectedFaculty }: AssignmentPanelProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const { data: assignments, isLoading, isError } = useAssignments(
    selectedFaculty?.id ?? ""
  )
  const deleteAssignment = useDeleteAssignment(selectedFaculty?.id ?? "")

  // Cycling colors for the area order badge
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

  if (!selectedFaculty) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full min-h-[500px] flex items-center justify-center">
        <EmptyState
          icon={UserCheck}
          title="Select a faculty member"
          description="Choose from the left panel to manage assignments"
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50 rounded-t-xl">
        <div className="flex items-center gap-4">
          <AvatarInitials name={selectedFaculty.name} size="lg" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {selectedFaculty.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium text-slate-600">
                {selectedFaculty.department}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-sm text-slate-500">
                {selectedFaculty.designation}
              </span>
            </div>
          </div>
        </div>

        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Assign Area
        </Button>
      </div>

      {/* Assignment List */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">
          Current Assignments
        </h3>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading assignments...
          </div>
        ) : isError ? (
          <p className="text-sm text-red-500 py-4">
            Failed to load assignments.
          </p>
        ) : assignments && assignments.length > 0 ? (
          <div className="space-y-3">
            {assignments.map((assignment) => {
              const colorClass =
                COLORS[(assignment.area.order ?? 0) % COLORS.length]
              const areaNum = (assignment.area.order ?? 0) + 1
              return (
                <div
                  key={assignment.id}
                  className="bg-white rounded-lg border border-slate-200 p-3 flex items-center hover:border-slate-300 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${colorClass}`}
                  >
                    {areaNum}
                  </div>

                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      Area {areaNum}: {assignment.area.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {assignment.criterion
                        ? assignment.criterion.name
                        : "All Criteria"}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 ml-4 shrink-0">
                    <span className="text-xs text-slate-400">
                      Assigned{" "}
                      {new Date(assignment.createdAt).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50"
                      disabled={deleteAssignment.isPending}
                      onClick={() => deleteAssignment.mutate(assignment.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-sm text-slate-500">
              No areas assigned yet. Click Assign Area to get started.
            </p>
          </div>
        )}
      </div>

      <AssignmentModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        facultyId={selectedFaculty.id}
        facultyName={selectedFaculty.name}
      />
    </div>
  )
}
