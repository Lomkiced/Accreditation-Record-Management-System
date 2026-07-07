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
import { useCreateArea, useUpdateArea } from "@/hooks/useAreas"

const areaSchema = z.object({
  name: z.string().min(1, "Area Name is required"),
  description: z.string().optional(),
})

type AreaFormValues = z.infer<typeof areaSchema>

interface AreaFormModalProps {
  open: boolean
  onClose: () => void
  initialData?: AreaFormValues
  /** Present when editing an existing area */
  areaId?: string
}

export function AreaFormModal({
  open,
  onClose,
  initialData,
  areaId,
}: AreaFormModalProps) {
  const createArea = useCreateArea()
  const updateArea = useUpdateArea()

  const isEditing = !!areaId

  const form = useForm<AreaFormValues>({
    resolver: zodResolver(areaSchema),
    defaultValues: initialData || { name: "", description: "" },
  })

  React.useEffect(() => {
    if (open) {
      form.reset(initialData || { name: "", description: "" })
    }
  }, [open, initialData, form])

  const onSubmit = (data: AreaFormValues) => {
    if (isEditing) {
      updateArea.mutate({ id: areaId, data }, { onSuccess: () => onClose() })
    } else {
      createArea.mutate(data, { onSuccess: () => onClose() })
    }
  }

  const isPending = createArea.isPending || updateArea.isPending

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Area" : "Add New Area"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Area Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Area 1: Purposes and Objectives"
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
              placeholder="Brief description of this area..."
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
                "Save Area"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
