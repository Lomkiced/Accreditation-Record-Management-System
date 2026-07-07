"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCreateCriterion, useUpdateCriterion } from "@/hooks/useAreas"

const criterionSchema = z.object({
  name: z.string().min(1, "Criterion Name is required"),
  description: z.string().optional(),
})

type CriterionFormValues = z.infer<typeof criterionSchema>

interface CriterionFormModalProps {
  open: boolean
  onClose: () => void
  areaId: string
  /** Present when editing an existing criterion */
  criterionId?: string
  initialData?: CriterionFormValues
}

export function CriterionFormModal({
  open,
  onClose,
  areaId,
  criterionId,
  initialData,
}: CriterionFormModalProps) {
  const createCriterion = useCreateCriterion()
  const updateCriterion = useUpdateCriterion(areaId)

  const isEditing = !!criterionId

  const form = useForm<CriterionFormValues>({
    resolver: zodResolver(criterionSchema),
    defaultValues: initialData || { name: "", description: "" },
  })

  React.useEffect(() => {
    if (open) {
      form.reset(initialData || { name: "", description: "" })
    }
  }, [open, initialData, form])

  const onSubmit = (data: CriterionFormValues) => {
    if (isEditing) {
      updateCriterion.mutate(
        { id: criterionId, data },
        { onSuccess: () => onClose() }
      )
    } else {
      createCriterion.mutate(
        { areaId, ...data },
        { onSuccess: () => onClose() }
      )
    }
  }

  const isPending = createCriterion.isPending || updateCriterion.isPending

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Criterion" : "Add Criterion"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Criterion Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., A. Statement of Purposes"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this criterion..."
              {...form.register("description")}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Criterion"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
