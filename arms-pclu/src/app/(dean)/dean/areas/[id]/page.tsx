"use client"

import * as React from "react"
import { Plus, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { IndicatorTable } from "@/components/areas/IndicatorTable"
import { useAreas, useCreateIndicator, useUpdateIndicator } from "@/hooks/useAreas"
import type { IndicatorWithMappings } from "@/actions/indicator.actions"
import { IndicatorFormModal } from "@/components/areas/IndicatorFormModal"


export default function AreaDetailPage({ params }: { params: { id: string } }) {
  const { data: areas, isLoading, isError } = useAreas()
  const searchParams = useSearchParams()
  const criterionIdParam = searchParams.get("criterionId")

  const [addModal, setAddModal] = React.useState<{ criterionId: string } | null>(null)
  const [editModal, setEditModal] = React.useState<{
    criterionId: string
    indicator: IndicatorWithMappings
  } | null>(null)

  const area = areas?.find((a) => a.id === params.id)
  const displayCriteria = React.useMemo(() => {
    if (!area) return []
    if (criterionIdParam) return area.criteria.filter(c => c.id === criterionIdParam)
    return area.criteria
  }, [area, criterionIdParam])

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
          { label: "Areas", href: "/dean/areas" },
          { label: area.name },
        ]}
      />

      <div className="space-y-4">
        {displayCriteria.map((criterion) => (
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

        {displayCriteria.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            No criterias found. {criterionIdParam ? "The specified criteria might not exist." : "Go back and add criterias first."}
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
