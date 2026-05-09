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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AssignmentModalProps {
  open: boolean
  onClose: () => void
  facultyName: string
}

const mockAreas = [
  { id: "1", name: "Area 1: Purposes and Objectives" },
  { id: "2", name: "Area 2: Faculty" },
  { id: "3", name: "Area 3: Instruction" },
]

const mockCriteria = [
  { id: "c1", name: "A. Academic Qualifications" },
  { id: "c2", name: "B. Professional Performance" },
  { id: "c3", name: "C. Professional Development" },
]

export function AssignmentModal({ open, onClose, facultyName }: AssignmentModalProps) {
  const [selectedArea, setSelectedArea] = React.useState<string>("")
  const [selectedCriteria, setSelectedCriteria] = React.useState<string[]>([])

  const handleCriterionToggle = (id: string) => {
    setSelectedCriteria(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleAssign = () => {
    console.log({ selectedArea, selectedCriteria })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Area to {facultyName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label>Select PAASCU Area <span className="text-red-500">*</span></Label>
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an area..." />
              </SelectTrigger>
              <SelectContent>
                {mockAreas.map(area => (
                  <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedArea && (
            <div className="space-y-3">
              <Label>Select Criteria to Assign <span className="text-red-500">*</span></Label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3 max-h-[200px] overflow-y-auto">
                {mockCriteria.map(criterion => (
                  <div key={criterion.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`crit-${criterion.id}`} 
                      checked={selectedCriteria.includes(criterion.id)}
                      onCheckedChange={() => handleCriterionToggle(criterion.id)}
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
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea placeholder="Any specific instructions..." className="resize-none" />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white" 
            onClick={handleAssign}
            disabled={!selectedArea || selectedCriteria.length === 0}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
