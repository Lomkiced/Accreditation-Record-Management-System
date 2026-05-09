"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { IndicatorTable } from "@/components/areas/IndicatorTable"

const mockArea = {
  id: "1",
  name: "Area 1: Purposes and Objectives",
}

const mockCriteria = [
  {
    id: "c1",
    name: "A. Statement of Purposes and Objectives",
    indicators: [
      { id: "i1", number: "1.1", name: "The institution has a clearly stated purpose.", requiredDocs: "Board Resolution, Institutional Manual", rating: 4, submissionsCount: 2 },
      { id: "i2", number: "1.2", name: "The purpose is aligned with the vision and mission.", requiredDocs: "Vision/Mission Statement", rating: 5, submissionsCount: 1 },
    ]
  },
  {
    id: "c2",
    name: "B. Specific Objectives",
    indicators: [
      { id: "i3", number: "2.1", name: "Specific objectives are formulated.", requiredDocs: "Department Manuals", rating: null, submissionsCount: 0 },
    ]
  }
]

export default function AreaDetailPage({ params }: { params: { id: string } }) {
  return (
    <>
      <PageHeader
        title={mockArea.name}
        breadcrumbs={[
          { label: "Areas", href: "/admin/areas" },
          { label: mockArea.name },
        ]}
        actions={
          <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus className="w-4 h-4 mr-2" />
            Add Indicator
          </Button>
        }
      />

      <div className="space-y-4">
        {mockCriteria.map((criterion) => (
          <div key={criterion.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{criterion.name}</h3>
              <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                {criterion.indicators.length} Indicators
              </span>
            </div>
            <div className="p-0">
              <IndicatorTable indicators={criterion.indicators} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
