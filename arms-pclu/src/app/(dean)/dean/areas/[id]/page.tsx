"use client"

import * as React from "react"
import { Plus, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { IndicatorTable } from "@/components/areas/IndicatorTable"
import { useAreas, useCreateIndicator, useUpdateIndicator } from "@/hooks/useAreas"
import type { IndicatorWithMappings } from "@/actions/indicator.actions"
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const indicatorSchema = z.object({
  name: z.string().min(1, "Indicator name is required"),
  requiredDocs: z.string().optional(),
  ratingScale: z.coerce.number().int().min(1).max(10).default(5),
})
type IndicatorFormValues = z.infer<typeof indicatorSchema>

interface IndicatorFormModalProps {
  open: boolean
  onClose: () => void
  criterionId: string
  indicator?: IndicatorWithMappings
}

function IndicatorFormModal({
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
      ratingScale: indicator?.ratingScale ?? 5,
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: indicator?.name ?? "",
        requiredDocs: indicator?.requiredDocs ?? "",
        ratingScale: indicator?.ratingScale ?? 5,
      })
    }
  }, [open, indicator, form])

  const onSubmit = (data: IndicatorFormValues) => {
    if (indicator) {
      updateIndicator.mutate(
        { id: indicator.id, data },
        { onSuccess: () => onClose() }
      )
    } else {
      createIndicator.mutate(
        { criterionId, ...data },
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
            <Label htmlFor="ind-docs">Required Documents</Label>
            <Textarea
              id="ind-docs"
              placeholder="e.g., Board Resolution, Institutional Manual"
              {...form.register("requiredDocs")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ind-scale">Rating Scale (1–10)</Label>
            <Input
              id="ind-scale"
              type="number"
              min={1}
              max={10}
              {...form.register("ratingScale")}
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

// ─── Area Detail Page ─────────────────────────────────────────────────────────

export default function AreaDetailPage({ params }: { params: { id: string } }) {
  const { data: areas, isLoading, isError } = useAreas()
  const [addModal, setAddModal] = React.useState<{ criterionId: string } | null>(null)
  const [editModal, setEditModal] = React.useState<{
    criterionId: string
    indicator: IndicatorWithMappings
  } | null>(null)

  const area = areas?.find((a) => a.id === params.id)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading area...
      </div>
    )
  }

  if (isError || !area) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-500 mb-4">Area not found.</p>
        <Link href="/admin/areas">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Areas
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title={area.name}
        breadcrumbs={[
          { label: "Areas", href: "/admin/areas" },
          { label: area.name },
        ]}
      />

      <div className="space-y-4">
        {area.criteria.map((criterion) => (
          <div
            key={criterion.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{criterion.name}</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                  {criterion.indicators.length} Indicator
                  {criterion.indicators.length !== 1 ? "s" : ""}
                </span>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7"
                  onClick={() => setAddModal({ criterionId: criterion.id })}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Indicator
                </Button>
              </div>
            </div>
            <div className="p-0">
              <IndicatorTable
                indicators={criterion.indicators}
                criterionId={criterion.id}
                onEdit={(ind) =>
                  setEditModal({ criterionId: criterion.id, indicator: ind })
                }
              />
            </div>
          </div>
        ))}

        {area.criteria.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            No criteria in this area yet. Go back and add criteria first.
          </div>
        )}
      </div>

      {/* Add Indicator modal */}
      {addModal && (
        <IndicatorFormModal
          open={!!addModal}
          onClose={() => setAddModal(null)}
          criterionId={addModal.criterionId}
        />
      )}

      {/* Edit Indicator modal */}
      {editModal && (
        <IndicatorFormModal
          open={!!editModal}
          onClose={() => setEditModal(null)}
          criterionId={editModal.criterionId}
          indicator={editModal.indicator}
        />
      )}
    </>
  )
}
