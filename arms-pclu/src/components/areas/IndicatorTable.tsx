"use client"

import * as React from "react"
import { Edit, Trash2, Star } from "lucide-react"
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
}

export function IndicatorTable({
  indicators,
  criterionId,
  onEdit,
}: IndicatorTableProps) {
  const deleteIndicator = useDeleteIndicator(criterionId)

  if (!indicators || indicators.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-slate-500">
        No indicators added yet.
      </div>
    )
  }

  const renderRating = (rating: number | null) => {
    if (rating === null)
      return <span className="text-xs text-slate-400">Not rated</span>
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < rating
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-200 text-slate-200"
            }`}
          />
        ))}
        <span className="text-xs font-medium ml-1.5 text-slate-600">
          {rating}/5
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
            <th className="px-4 py-3 font-medium">Rating Scale</th>
            <th className="px-4 py-3 font-medium text-center">Submissions</th>
            <th className="px-4 py-3 font-medium rounded-tr-lg text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {indicators.map((ind, idx) => {
            // Compute dominant rating from approved mappings
            const approvedRatings = ind.mappings
              .filter((m) => m.status === "APPROVED" && m.rating !== null)
              .map((m) => m.rating as number)
            const avgRating =
              approvedRatings.length > 0
                ? Math.round(
                    approvedRatings.reduce((a, b) => a + b, 0) /
                      approvedRatings.length
                  )
                : null

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
                <td className="px-4 py-3">{renderRating(avgRating)}</td>
                <td className="px-4 py-3 text-center">
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
                    {ind.mappings.length}
                  </span>
                </td>
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
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
