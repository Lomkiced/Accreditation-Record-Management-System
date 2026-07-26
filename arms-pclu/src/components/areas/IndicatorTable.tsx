"use client"

import * as React from "react"
import { Edit, Trash2, FileText, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDeleteIndicator } from "@/hooks/useAreas"
import type { IndicatorWithMappings } from "@/actions/indicator.actions"

interface IndicatorTableProps {
  indicators: IndicatorWithMappings[]
  criterionId: string
  /** Called when the edit button is clicked for an indicator */
  onEdit?: (indicator: IndicatorWithMappings) => void
  readOnly?: boolean
}

export function IndicatorTable({
  indicators,
  criterionId,
  onEdit,
  readOnly = false,
}: IndicatorTableProps) {
  const deleteIndicator = useDeleteIndicator(criterionId)

  if (!indicators || indicators.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-slate-500">
        No indicators added yet.
      </div>
    )
  }

  const renderEvidence = (mappings: IndicatorWithMappings["mappings"]) => {
    // Prefer APPROVED, otherwise fallback to the most recent SUBMITTED/UNDER_REVIEW
    const approved = mappings.find(m => m.status === "APPROVED")
    const latest = approved || mappings.find(m => m.status !== "DRAFT" && m.status !== "RETURNED")
    
    if (!latest) {
      return <span className="text-xs text-slate-400 italic">No evidence</span>
    }
    
    const isApproved = latest.status === "APPROVED"
    const Icon = isApproved ? CheckCircle : Clock
    const colorClass = isApproved ? "text-emerald-500" : "text-amber-500"
    
    return (
      <div className="flex items-center gap-2 max-w-[200px]">
        <Icon className={`w-3.5 h-3.5 shrink-0 ${colorClass}`} />
        <span className="text-xs font-medium text-slate-700 truncate" title={latest.document.title}>
          {latest.document.title}
        </span>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th className="px-4 py-3 font-medium rounded-tl-lg">#</th>
            <th className="px-4 py-3 font-medium">Indicator Name</th>
            <th className="px-4 py-3 font-medium">Required Documents</th>
            <th className="px-4 py-3 font-medium">Evidence</th>
            {!readOnly && (
              <th className="px-4 py-3 font-medium rounded-tr-lg text-right">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {indicators.map((ind, idx) => {
            return (
              <tr
                key={ind.id}
                className="hover:bg-slate-50 transition-colors bg-white"
              >
                <td className="px-4 py-3 font-medium text-slate-900">
                  {idx + 1}
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {ind.name}
                </td>
                <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
                  {ind.requiredDocs ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-default truncate block w-full text-left">
                          {ind.requiredDocs}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{ind.requiredDocs}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-slate-400 italic">Not specified</span>
                  )}
                </td>
                <td className="px-4 py-3">{renderEvidence(ind.mappings)}</td>
                {!readOnly && (
                  <td className="px-4 py-3 text-right">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-blue-600"
                        onClick={() => onEdit(ind)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-500"
                      disabled={deleteIndicator.isPending}
                      onClick={() => deleteIndicator.mutate(ind.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
