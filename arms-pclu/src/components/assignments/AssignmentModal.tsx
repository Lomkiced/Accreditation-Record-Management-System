"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Loader2, AlertCircle, Layers, ListChecks, CheckCircle2, Info } from "lucide-react"
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
  const [scope, setScope] = React.useState<"area" | "criteria">("criteria")
  const [selectedCriterionIds, setSelectedCriterionIds] = React.useState<string[]>([])
  const [notes, setNotes] = React.useState("")

  const { data: areas, isLoading: areasLoading } = useAreas()
  const { data: allAssignments, isLoading: assignmentsLoading } = useActiveAssignments()
  const createAssignment = useCreateAssignment()

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setSelectedAreaId("")
      setScope("criteria")
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

  // When area changes, decide initial scope
  const handleAreaChange = (areaId: string) => {
    setSelectedAreaId(areaId)
    setSelectedCriterionIds([])

    const currentAreaAssignments = allAssignments?.filter((a) => a.areaId === areaId) || []
    if (currentAreaAssignments.length === 0) {
      setScope("area")
    } else {
      setScope("criteria")
    }
  }

  // Available (unassigned) criteria for this area
  const availableCriteria = React.useMemo(() => {
    if (!selectedArea) return []
    return selectedArea.criteria.filter((c) => !assignedCriteriaMap.has(c.id))
  }, [selectedArea, assignedCriteriaMap])

  const handleCriterionToggle = (id: string) => {
    setSelectedCriterionIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleSelectAllAvailable = () => {
    setSelectedCriterionIds(availableCriteria.map((c) => c.id))
  }

  const handleDeselectAll = () => {
    setSelectedCriterionIds([])
  }

  const handleAssign = async () => {
    if (!selectedAreaId) return

    try {
      if (scope === "area") {
        await createAssignment.mutateAsync({
          userId: facultyId,
          areaId: selectedAreaId,
          notes: notes.trim() || undefined,
        })
      } else {
        if (selectedCriterionIds.length === 0) return
        await Promise.all(
          selectedCriterionIds.map((criterionId) =>
            createAssignment.mutateAsync({
              userId: facultyId,
              areaId: selectedAreaId,
              criterionId,
              notes: notes.trim() || undefined,
            })
          )
        )
      }
      onClose()
    } catch {
      // Error is handled by onError toast in useCreateAssignment
    }
  }

  const isPending = createAssignment.isPending
  const hasAreaConflict = !!wholeAreaAssignment
  const hasPartialAssignments = areaAssignments.length > 0 && !wholeAreaAssignment
  const allCriteriaInAreaAssigned =
    !!selectedArea &&
    selectedArea.criteria.length > 0 &&
    selectedArea.criteria.every((c) => assignedCriteriaMap.has(c.id))

  const isAssignDisabled =
    !selectedAreaId ||
    isPending ||
    hasAreaConflict ||
    (scope === "area" && hasPartialAssignments) ||
    (scope === "criteria" && selectedCriterionIds.length === 0) ||
    (scope === "criteria" && allCriteriaInAreaAssigned)

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                Assign Accreditation Area
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 mt-1">
                Assign PACUCOA areas and criteria responsibilities to{" "}
                <span className="font-semibold text-slate-800">{facultyName}</span>.
              </DialogDescription>
            </div>
            <Badge variant="outline" className="bg-blue-50/80 text-blue-700 border-blue-200 text-xs px-2.5 py-1">
              Faculty Assignee
            </Badge>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Area Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              PACUCOA Area <span className="text-red-500">*</span>
            </Label>
            {areasLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                Loading accreditation areas...
              </div>
            ) : (
              <Select value={selectedAreaId} onValueChange={handleAreaChange}>
                <SelectTrigger className="w-full bg-white border-slate-200 shadow-sm text-slate-800 font-medium h-11">
                  <SelectValue placeholder="Choose an accreditation area..." />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-xl border-slate-200 max-h-[300px]">
                  {areas?.map((area) => (
                    <SelectItem key={area.id} value={area.id} className="py-2.5 text-sm">
                      <span className="font-medium text-slate-800">{area.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Area level collision alert */}
          {wholeAreaAssignment && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs leading-relaxed">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-900">Area Fully Assigned:</span>{" "}
                {wholeAreaAssignment.userId === facultyId ? (
                  <>This entire area is already assigned to <span className="font-semibold">{facultyName}</span>.</>
                ) : (
                  <>
                    This entire area is currently assigned to{" "}
                    <span className="font-semibold text-amber-950">
                      {wholeAreaAssignment.user.name}
                    </span>
                    . You cannot assign this area or any of its criteria until that assignment is revoked.
                  </>
                )}
              </div>
            </div>
          )}

          {/* Scope Selection Cards */}
          {!wholeAreaAssignment && selectedArea && (
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Assignment Scope
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Entire Area */}
                <div
                  onClick={() => {
                    if (!hasPartialAssignments) setScope("area")
                  }}
                  className={cn(
                    "p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between",
                    hasPartialAssignments
                      ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200"
                      : scope === "area"
                      ? "bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20 cursor-pointer"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className={cn("w-4 h-4", scope === "area" ? "text-blue-600" : "text-slate-500")} />
                      <span className="text-sm font-semibold text-slate-900">Entire Area</span>
                    </div>
                    {scope === "area" && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {hasPartialAssignments
                      ? "Cannot assign whole area because some criteria are already individually assigned."
                      : `Assign all ${selectedArea.criteria.length} criteria in this area to ${facultyName}.`}
                  </p>
                </div>

                {/* Option 2: Specific Criteria */}
                <div
                  onClick={() => setScope("criteria")}
                  className={cn(
                    "p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer",
                    scope === "criteria"
                      ? "bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListChecks className={cn("w-4 h-4", scope === "criteria" ? "text-blue-600" : "text-slate-500")} />
                      <span className="text-sm font-semibold text-slate-900">Specific Criteria</span>
                    </div>
                    {scope === "criteria" && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Select individual criteria to assign. Supports multiple faculty collaborating on one area.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Criteria Checklist (When Specific Criteria is active) */}
          {!wholeAreaAssignment && selectedArea && scope === "criteria" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Select Criteria
                  </Label>
                  <Badge variant="secondary" className="text-xs font-normal bg-slate-100 text-slate-600">
                    {selectedCriterionIds.length} of {availableCriteria.length} available selected
                  </Badge>
                </div>

                {availableCriteria.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllAvailable}
                      className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Select all
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-slate-500 hover:text-slate-700 font-medium hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {assignmentsLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-4 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  Checking criterion assignments...
                </div>
              ) : selectedArea.criteria.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No criteria defined in this area yet.
                </div>
              ) : (
                <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 space-y-2 max-h-[260px] overflow-y-auto">
                  {selectedArea.criteria.map((criterion) => {
                    const existingAssignee = assignedCriteriaMap.get(criterion.id)
                    const isAssigned = !!existingAssignee
                    const isAssignedToThisFaculty = existingAssignee?.userId === facultyId
                    const isChecked = selectedCriterionIds.includes(criterion.id)

                    return (
                      <div
                        key={criterion.id}
                        onClick={() => {
                          if (!isAssigned) handleCriterionToggle(criterion.id)
                        }}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-all",
                          isAssigned
                            ? "bg-slate-100/90 border-slate-200/80 cursor-not-allowed opacity-85"
                            : isChecked
                            ? "bg-blue-50/80 border-blue-200/90 shadow-sm cursor-pointer"
                            : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/80 cursor-pointer"
                        )}
                      >
                        <Checkbox
                          id={`crit-${criterion.id}`}
                          checked={isChecked}
                          disabled={isAssigned}
                          onCheckedChange={() => handleCriterionToggle(criterion.id)}
                          className="mt-0.5 shrink-0 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={`crit-${criterion.id}`}
                            className={cn(
                              "text-sm font-medium leading-snug break-words block select-none",
                              isAssigned ? "text-slate-600 cursor-not-allowed" : "text-slate-800 cursor-pointer"
                            )}
                          >
                            {criterion.name}
                          </label>
                        </div>

                        {isAssigned && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[11px] px-2 py-0.5 shrink-0 font-medium ml-2 whitespace-nowrap",
                              isAssignedToThisFaculty
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            )}
                          >
                            {isAssignedToThisFaculty
                              ? "Assigned to this faculty"
                              : `Assigned: ${existingAssignee.user.name}`}
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {allCriteriaInAreaAssigned && (
                <div className="flex items-center gap-2 text-xs text-red-600 font-medium pt-1">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  All criteria in this area are already assigned.
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Notes or Instructions <span className="text-slate-400 font-normal normal-case">(Optional)</span>
            </Label>
            <Textarea
              placeholder="Add specific guidelines, deadlines, or expectations for the faculty member..."
              className="resize-none min-h-[85px] bg-white border-slate-200 focus:border-blue-500 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 px-6 border-t border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between sm:justify-between">
          <div className="text-xs text-slate-500">
            {scope === "area" && selectedArea && !hasPartialAssignments && !wholeAreaAssignment ? (
              <span className="text-blue-700 font-medium">Ready to assign whole area</span>
            ) : scope === "criteria" && selectedCriterionIds.length > 0 ? (
              <span className="text-blue-700 font-medium">
                {selectedCriterionIds.length} {selectedCriterionIds.length === 1 ? "criterion" : "criteria"} selected
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isPending} className="text-slate-600 hover:text-slate-900">
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-5"
              onClick={handleAssign}
              disabled={isAssignDisabled}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Confirm Assignment"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
