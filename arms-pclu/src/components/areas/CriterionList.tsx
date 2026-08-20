"use client"

import * as React from "react"
import Link from "next/link"
import { Edit, Trash2, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCriteria, useDeleteCriterion } from "@/hooks/useAreas"
import { CriterionFormModal } from "./CriterionFormModal"
import type { CriterionWithIndicators } from "@/actions/criterion.actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CriterionListProps {
  areaId: string
  mode?: "dean" | "admin"
}

export function CriterionList({ areaId, mode = "dean" }: CriterionListProps) {
  const { data: criteria, isLoading, isError } = useCriteria(areaId)
  const deleteCriterion = useDeleteCriterion(areaId)

  const [addOpen, setAddOpen] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<CriterionWithIndicators | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<CriterionWithIndicators | null>(null)

  // Compute completion percentage using indicator-level compliance:
  // "How many indicators in this criterion have ≥1 APPROVED mapping?"
  // This aligns with the dashboard's canonical compliance metric.
  const getCompletion = (criterion: CriterionWithIndicators): number => {
    const total = criterion.indicators.length
    if (total === 0) return 0
    const approved = criterion.indicators.filter((i) =>
      i.mappings.some((m) => m.status === "APPROVED")
    ).length
    return Math.round((approved / total) * 100)
  }

  const getCompletionPill = (completion: number) => {
    if (mode === "dean") return null
    if (completion === 100)
      return (
        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
          100%
        </span>
      )
    if (completion > 0)
      return (
        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
          {completion}%
        </span>
      )
    return (
      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-medium">
        0%
      </span>
    )
  }



  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading criterias...
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-red-500 py-4">
        Failed to load criterias. Please try again.
      </p>
    )
  }

  return (
    <div>
      <div className="space-y-2 mb-4">
        {criteria && criteria.length > 0 ? (
          criteria.map((criterion) => {
            const completion = getCompletion(criterion)
            return (
              <div
                key={criterion.id}
                className="bg-white rounded-lg border border-slate-200 p-3 flex items-center hover:border-slate-300 transition-colors"
              >
                <h4 className="text-sm font-medium text-slate-800 flex-1">
                  {criterion.name}
                </h4>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                    {criterion.indicators.length} Indicator
                    {criterion.indicators.length !== 1 ? "s" : ""}
                  </span>
                  {getCompletionPill(completion)}

                  <div className="h-4 w-px bg-slate-200 mx-1" />

                  <Link href={mode === "admin" ? `/admin/areas/${areaId}?criterionId=${criterion.id}` : `/dean/areas/${areaId}?criterionId=${criterion.id}`}>
                    <span className="text-xs text-blue-600 hover:underline cursor-pointer mr-2 font-medium">
                      View Indicators
                    </span>
                  </Link>

                  {mode === "dean" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-blue-600"
                        onClick={() => setEditTarget(criterion)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-red-500"
                        disabled={deleteCriterion.isPending}
                        onClick={() => setDeleteTarget(criterion)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-sm text-slate-500 py-2">
            No criterias yet. Add one below.
          </p>
        )}
      </div>

      {mode === "dean" && (
        <Button
          variant="outline"
          size="sm"
          className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Criteria
        </Button>
      )}

      {/* Add modal */}
      <CriterionFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        areaId={areaId}
      />

      {/* Edit modal */}
      {editTarget && (
        <CriterionFormModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          areaId={areaId}
          criterionId={editTarget.id}
          initialData={{
            name: editTarget.name,
            description: editTarget.description ?? "",
          }}
        />
      )}

      {/* Delete confirmation modal */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the criteria
              <strong> {deleteTarget?.name}</strong> and all its associated indicators.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCriterion.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
              disabled={deleteCriterion.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) {
                  deleteCriterion.mutate(deleteTarget.id, {
                    onSuccess: () => setDeleteTarget(null)
                  });
                }
              }}
            >
              {deleteCriterion.isPending ? "Deleting..." : "Delete Criteria"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
