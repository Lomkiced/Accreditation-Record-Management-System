"use client"

import * as React from "react"
import { Edit, Trash2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Indicator {
  id: string
  number: string
  name: string
  requiredDocs: string
  rating: number | null
  submissionsCount: number
}

interface IndicatorTableProps {
  indicators: Indicator[]
}

export function IndicatorTable({ indicators }: IndicatorTableProps) {
  if (!indicators || indicators.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-slate-500">
        No indicators added yet.
      </div>
    )
  }

  const renderRating = (rating: number | null) => {
    if (rating === null) return <span className="text-xs text-slate-400">Not rated</span>
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
          />
        ))}
        <span className="text-xs font-medium ml-1.5 text-slate-600">{rating}/5</span>
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
            <th className="px-4 py-3 font-medium rounded-tr-lg text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {indicators.map((ind) => (
            <tr key={ind.id} className="hover:bg-slate-50 transition-colors bg-white">
              <td className="px-4 py-3 font-medium text-slate-900">{ind.number}</td>
              <td className="px-4 py-3 font-medium text-slate-800">{ind.name}</td>
              <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
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
              </td>
              <td className="px-4 py-3">{renderRating(ind.rating)}</td>
              <td className="px-4 py-3 text-center">
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {ind.submissionsCount}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
