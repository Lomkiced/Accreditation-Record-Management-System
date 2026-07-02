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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useAreas } from "@/hooks/useAreas"
import { useCreateAssignment } from "@/hooks/useAssignments"

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

  const handleCriterionToggle = (id: string) => {
    setSelectedCriterionIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleAssign = async () => {
    if (!selectedAreaId) return

    // If no specific criteria selected, create an area-level assignment (criterionId: null)
    if (selectedCriterionIds.length === 0) {
      const result = await createAssignment.mutateAsync({
        userId: facultyId,
        areaId: selectedAreaId,
        notes: notes || undefined,
      })
      if (result?.success) onClose()
      return
    }

    // Create one assignment per selected criterion
    const results = await Promise.all(
      selectedCriterionIds.map((criterionId) =>
        createAssignment.mutateAsync({
          userId: facultyId,
          areaId: selectedAreaId,
          criterionId,
          notes: notes || undefined,
        })
      )
    )

    // Close if all succeeded
    if (results.every((r) => r?.success)) {
      onClose()
    }
  }

  const isPending = createAssignment.isPending

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
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
                <SelectTrigger>
                  <SelectValue placeholder="Choose an area..." />
                </SelectTrigger>
                <SelectContent>
                  {areas?.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      Area {area.order + 1}: {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Criteria selector — only shown when an area is selected */}
          {selectedArea && selectedArea.criteria.length > 0 && (
            <div className="space-y-3">
              <Label>
                Select Specific Criteria{" "}
                <span className="text-slate-400 font-normal">
                  (leave empty to assign entire area)
                </span>
              </Label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3 max-h-[200px] overflow-y-auto">
                {selectedArea.criteria.map((criterion) => (
                  <div
                    key={criterion.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`crit-${criterion.id}`}
                      checked={selectedCriterionIds.includes(criterion.id)}
                      onCheckedChange={() =>
                        handleCriterionToggle(criterion.id)
                      }
                    />
                    <label
                      htmlFor={`crit-${criterion.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {criterion.name}
                    </label>
                  </div>
                ))}
              </div>
              {selectedCriterionIds.length === 0 && (
                <p className="text-xs text-amber-600">
                  No criteria selected — this will assign the entire area.
                </p>
              )}
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
            disabled={!selectedAreaId || isPending}
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
