"use client"

import * as React from "react"
import Link from "next/link"
import { Edit, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CriterionListProps {
  areaId: string
}

const mockCriteria = [
  { id: "1", name: "A. Purpose and Objectives", indicatorCount: 5, completion: 80 },
  { id: "2", name: "B. Specific Objectives", indicatorCount: 3, completion: 100 },
]

export function CriterionList({ areaId }: CriterionListProps) {
  const getCompletionPill = (completion: number) => {
    if (completion === 100) return <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">100%</span>
    if (completion > 0) return <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">{completion}%</span>
    return <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-medium">0%</span>
  }

  return (
    <div>
      <div className="space-y-2 mb-4">
        {mockCriteria.map((criterion) => (
          <div key={criterion.id} className="bg-white rounded-lg border border-slate-200 p-3 flex items-center hover:border-slate-300 transition-colors">
            <h4 className="text-sm font-medium text-slate-800 flex-1">{criterion.name}</h4>
            
            <div className="flex items-center gap-3">
              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                {criterion.indicatorCount} Indicators
              </span>
              {getCompletionPill(criterion.completion)}
              
              <div className="h-4 w-px bg-slate-200 mx-1" />
              
              <Link href={`/areas/${areaId}`}>
                <span className="text-xs text-blue-600 hover:underline cursor-pointer mr-2 font-medium">
                  View Indicators
                </span>
              </Link>
              
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-600">
                <Edit className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8">
        <Plus className="w-4 h-4 mr-1" />
        Add Criterion
      </Button>
    </div>
  )
}
