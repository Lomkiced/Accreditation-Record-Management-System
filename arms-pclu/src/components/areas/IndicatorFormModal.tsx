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

import { Lock } from "lucide-react"

const indicatorSchema = z.object({
  name: z.string().min(1, "Indicator name is required"),
  requiredDocs: z.string().optional(),
  isConfidential: z.boolean().default(false),
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
      isConfidential: (indicator as any)?.isConfidential ?? false,
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: indicator?.name ?? "",
        requiredDocs: indicator?.requiredDocs ?? "",
        isConfidential: (indicator as any)?.isConfidential ?? false,
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

          <div className="flex items-start space-x-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 mt-2">
            <input
              type="checkbox"
              id="ind-confidential"
              className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              {...form.register("isConfidential")}
            />
            <div className="space-y-0.5">
              <Label
                htmlFor="ind-confidential"
                className="text-xs font-semibold text-amber-900 cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Confidential Indicator (e.g. Strategic Plan)
              </Label>
              <p className="text-[11px] text-amber-700 leading-normal">
                Restricts evidence viewing from peer faculty. Only the Dean, Admin, and uploading faculty can open the files.
              </p>
            </div>
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
