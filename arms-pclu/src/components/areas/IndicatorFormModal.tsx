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

import { Lock, ShieldCheck, CheckSquare, Square } from "lucide-react"

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

  const [selectedConfidential, setSelectedConfidential] = React.useState<string[]>([])

  const form = useForm<IndicatorFormValues>({
    resolver: zodResolver(indicatorSchema),
    defaultValues: {
      name: indicator?.name ?? "",
      requiredDocs: indicator?.requiredDocs ?? "",
      isConfidential: (indicator as any)?.isConfidential ?? false,
    },
  })

  const requiredDocsValue = form.watch("requiredDocs") || ""

  // Parse required docs separated by newlines or commas
  const parsedDocs = React.useMemo(() => {
    if (!requiredDocsValue) return []
    return Array.from(
      new Set(
        requiredDocsValue
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      )
    )
  }, [requiredDocsValue])

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: indicator?.name ?? "",
        requiredDocs: indicator?.requiredDocs ?? "",
        isConfidential: (indicator as any)?.isConfidential ?? false,
      })

      // Initialize selected confidential docs
      const rawConfidential = (indicator as any)?.confidentialDocs
      if (rawConfidential) {
        try {
          const parsed = JSON.parse(rawConfidential)
          if (Array.isArray(parsed)) {
            setSelectedConfidential(parsed)
            return
          }
        } catch {
          // fallback below
        }
      }
      if ((indicator as any)?.isConfidential && indicator?.requiredDocs) {
        const initialDocs = indicator.requiredDocs
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
        setSelectedConfidential(initialDocs)
      } else {
        setSelectedConfidential([])
      }
    }
  }, [open, indicator, form])

  const allSelected = parsedDocs.length > 0 && parsedDocs.every((doc) => selectedConfidential.includes(doc))

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedConfidential([])
      form.setValue("isConfidential", false)
    } else {
      setSelectedConfidential([...parsedDocs])
      form.setValue("isConfidential", true)
    }
  }

  const handleToggleDoc = (doc: string) => {
    setSelectedConfidential((prev) => {
      const next = prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
      form.setValue("isConfidential", next.length > 0)
      return next
    })
  }

  const onSubmit = (data: IndicatorFormValues) => {
    const isConfidential = selectedConfidential.length > 0 || data.isConfidential
    const confidentialDocs = selectedConfidential.length > 0 ? JSON.stringify(selectedConfidential) : null

    const payload = {
      ...data,
      ratingScale: 5,
      isConfidential,
      confidentialDocs,
    }

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
      <DialogContent className="sm:max-w-[480px]">
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
              placeholder="e.g., Board Resolution, Institutional Manual, Faculty Evaluation Reports (comma or new line separated)"
              rows={3}
              {...form.register("requiredDocs")}
            />
            <p className="text-[11px] text-slate-500">
              Enter required documents separated by commas or line breaks.
            </p>
          </div>

          {/* Granular Confidential Evidence Selection */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-600" />
                <Label className="text-xs font-semibold text-amber-900">
                  Confidential Evidence
                </Label>
              </div>
              {parsedDocs.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-[11px] font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1"
                >
                  {allSelected ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-amber-600" />
                      Select All as Confidential
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-[11px] text-amber-700 leading-normal">
              Restricts evidence viewing from peer faculty. Only the Dean, Admin, and uploading faculty can open confidential files.
            </p>

            {parsedDocs.length > 0 ? (
              <div className="space-y-1.5 pt-1 border-t border-amber-200/60 max-h-40 overflow-y-auto">
                <div className="text-[11px] font-medium text-amber-800 mb-1">
                  Select which required documents are confidential:
                </div>
                {parsedDocs.map((doc, idx) => {
                  const isChecked = selectedConfidential.includes(doc)
                  return (
                    <label
                      key={`${doc}-${idx}`}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-amber-100/60 transition-colors cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleDoc(doc)}
                        className="h-3.5 w-3.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className={`font-medium ${isChecked ? "text-amber-950 font-semibold" : "text-slate-700"}`}>
                        {doc}
                      </span>
                    </label>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ind-confidential-fallback"
                  className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  {...form.register("isConfidential")}
                />
                <Label
                  htmlFor="ind-confidential-fallback"
                  className="text-xs text-amber-900 cursor-pointer"
                >
                  Mark this indicator as confidential
                </Label>
              </div>
            )}
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
