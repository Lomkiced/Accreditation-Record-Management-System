"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useCreateIndicator, useUpdateIndicator } from "@/hooks/useAreas"
import type { IndicatorWithMappings } from "@/actions/indicator.actions"

const indicatorSchema = z.object({
  name: z.string().min(1, "Indicator name is required"),
  requiredDocs: z.string().optional(),
})

type IndicatorFormValues = z.infer<typeof indicatorSchema>

interface IndicatorFormModalProps {
  open: boolean
  onClose: () => void
  criterionId: string
  indicator?: IndicatorWithMappings
}

export function IndicatorFormModal({
  open,
  onClose,
  criterionId,
  indicator,
}: IndicatorFormModalProps) {
  const createIndicator = useCreateIndicator(criterionId)
  const updateIndicator = useUpdateIndicator(criterionId)

  const form = useForm<IndicatorFormValues>({
    resolver: zodResolver(indicatorSchema),
    defaultValues: {
      name: indicator?.name ?? "",
      requiredDocs: indicator?.requiredDocs ?? "",
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: indicator?.name ?? "",
        requiredDocs: indicator?.requiredDocs ?? "",
      })
    }
  }, [open, indicator, form])

  const onSubmit = (data: IndicatorFormValues) => {
    const payload = { ...data, ratingScale: 5 }
    if (indicator) {
      updateIndicator.mutate(
        { id: indicator.id, data: payload },
        { onSuccess: () => onClose() }
      )
    } else {
      createIndicator.mutate(
        { criterionId, ...payload },
        { onSuccess: () => onClose() }
      )
    }
  }

  const isPending = createIndicator.isPending || updateIndicator.isPending

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>
            {indicator ? "Edit Indicator" : "Add Indicator"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="ind-name">
              Indicator Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ind-name"
              placeholder="e.g., The institution has a stated purpose."
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ind-docs">Required Evidence</Label>
            <Textarea
              id="ind-docs"
              placeholder="e.g., Board Resolution, Institutional Manual"
              {...form.register("requiredDocs")}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
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
                "Save Indicator"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
