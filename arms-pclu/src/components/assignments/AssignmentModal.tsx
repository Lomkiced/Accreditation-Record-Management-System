"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, AlertCircle } from "lucide-react"
import { useAreas } from "@/hooks/useAreas"
import { useCreateAssignment, useActiveAssignments } from "@/hooks/useAssignments"
import { cn } from "@/lib/utils"

interface AssignmentModalProps {
  open: boolean
  onClose: () => void
  /** The internal DB user ID of the faculty member being assigned */
  facultyId: string
  facultyName: string
}

export function AssignmentModal({
  open,
  onClose,
  facultyId,
  facultyName,
}: AssignmentModalProps) {
  const [selectedAreaId, setSelectedAreaId] = React.useState<string>("")
  const [selectedCriterionIds, setSelectedCriterionIds] = React.useState<
    string[]
  >([])
  const [notes, setNotes] = React.useState("")

  const { data: areas, isLoading: areasLoading } = useAreas()
  const { data: allAssignments, isLoading: assignmentsLoading } = useActiveAssignments()
  const createAssignment = useCreateAssignment()

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setSelectedAreaId("")
      setSelectedCriterionIds([])
      setNotes("")
    }
  }, [open])

  const selectedArea = areas?.find((a) => a.id === selectedAreaId)

  // Find all active assignments for the selected area
  const areaAssignments = React.useMemo(() => {
    if (!allAssignments || !selectedAreaId) return []
    return allAssignments.filter((a) => a.areaId === selectedAreaId)
  }, [allAssignments, selectedAreaId])

  // Is whole area already assigned to someone?
  const wholeAreaAssignment = areaAssignments.find((a) => !a.criterionId)

  // Map of criterionId -> assignment
  const assignedCriteriaMap = React.useMemo(() => {
    const map = new Map<string, (typeof areaAssignments)[number]>()
    areaAssignments.forEach((a) => {
      if (a.criterionId) {
        map.set(a.criterionId, a)
      }
    })
    return map
  }, [areaAssignments])

  const handleCriterionToggle = (id: string) => {
    setSelectedCriterionIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleAssign = async () => {
    if (!selectedAreaId) return

    try {
      if (selectedCriterionIds.length === 0) {
        await createAssignment.mutateAsync({
          userId: facultyId,
          areaId: selectedAreaId,
          notes: notes || undefined,
        })
      } else {
        await Promise.all(
          selectedCriterionIds.map((criterionId) =>
            createAssignment.mutateAsync({
              userId: facultyId,
              areaId: selectedAreaId,
              criterionId,
              notes: notes || undefined,
            })
          )
        )
      }
      onClose()
    } catch {
      // Error is handled by onError in useCreateAssignment
    }
  }

  const isPending = createAssignment.isPending
  const allCriteriaInAreaAssigned =
    !!selectedArea &&
    selectedArea.criteria.length > 0 &&
    selectedArea.criteria.every((c) => assignedCriteriaMap.has(c.id))

  const isAssignDisabled =
    !selectedAreaId ||
    isPending ||
    !!wholeAreaAssignment ||
    (selectedCriterionIds.length === 0 && areaAssignments.length > 0) ||
    allCriteriaInAreaAssigned

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Assign Area to {facultyName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Area selector */}
          <div className="space-y-2">
            <Label>
              Select PACUCOA Area <span className="text-red-500">*</span>
            </Label>
            {areasLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading areas...
              </div>
            ) : (
              <Select
                value={selectedAreaId}
                onValueChange={(val) => {
                  setSelectedAreaId(val)
                  setSelectedCriterionIds([]) // reset criteria when area changes
                }}
              >
                <SelectTrigger className="w-full bg-white border-slate-200">
                  <SelectValue placeholder="Choose an area..." />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-lg border-slate-200">
                  {areas?.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Area level collision alert */}
          {wholeAreaAssignment && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Area already assigned:</span>{" "}
                {wholeAreaAssignment.userId === facultyId ? (
                  <>This entire area is already assigned to {facultyName}.</>
                ) : (
                  <>
                    This entire area is already assigned to{" "}
                    <span className="font-semibold">
                      {wholeAreaAssignment.user.name}
                    </span>
                    . You cannot assign this area or any of its criteria until that assignment is removed.
                  </>
                )}
              </div>
            </div>
          )}

          {/* Criteria selector — only shown when an area is selected and not completely blocked by whole area */}
          {!wholeAreaAssignment && selectedArea && selectedArea.criteria.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>
                  Select Specific Criterias{" "}
                  <span className="text-slate-400 font-normal">
                    (leave empty to assign entire area)
                  </span>
                </Label>
                {assignmentsLoading && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Checking assignments...
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 max-h-[220px] overflow-y-auto">
                {selectedArea.criteria.map((criterion) => {
                  const existingAssignee = assignedCriteriaMap.get(criterion.id)
                  const isAssigned = !!existingAssignee
                  const isAssignedToThisFaculty =
                    existingAssignee?.userId === facultyId

                  return (
                    <div
                      key={criterion.id}
                      className={cn(
                        "flex items-center justify-between gap-3 p-2 rounded-md transition-colors",
                        isAssigned
                          ? "bg-slate-100/80 border border-slate-200/60"
                          : "hover:bg-white hover:border hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <Checkbox
                          id={`crit-${criterion.id}`}
                          checked={selectedCriterionIds.includes(criterion.id)}
                          disabled={isAssigned}
                          onCheckedChange={() =>
                            handleCriterionToggle(criterion.id)
                          }
                        />
                        <label
                          htmlFor={`crit-${criterion.id}`}
                          className={cn(
                            "text-sm font-medium leading-none select-none truncate",
                            isAssigned
                              ? "text-slate-500 cursor-not-allowed"
                              : "cursor-pointer text-slate-800"
                          )}
                          title={criterion.name}
                        >
                          {criterion.name}
                        </label>
                      </div>
                      {isAssigned && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-2 py-0.5 shrink-0 font-medium whitespace-nowrap",
                            isAssignedToThisFaculty
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          )}
                        >
                          {isAssignedToThisFaculty
                            ? "Assigned to this faculty"
                            : `Assigned to ${existingAssignee.user.name}`}
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>

              {allCriteriaInAreaAssigned ? (
                <p className="text-xs text-red-600 font-medium">
                  All criteria in this area are already assigned to faculty members.
                </p>
              ) : selectedCriterionIds.length === 0 && areaAssignments.length > 0 ? (
                <p className="text-xs text-amber-600 font-medium">
                  Note: Some criteria in this area are already assigned. To assign to {facultyName}, please select specific unassigned criteria above instead of the entire area.
                </p>
              ) : selectedCriterionIds.length === 0 && areaAssignments.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No criterias selected — this will assign the entire area to {facultyName}.
                </p>
              ) : null}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Any specific instructions..."
              className="resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleAssign}
            disabled={isAssignDisabled}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

