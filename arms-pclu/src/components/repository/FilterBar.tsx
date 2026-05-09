"use client"

import * as React from "react"
import { Search, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface FilterBarProps {
  totalResults: number
}

export function FilterBar({ totalResults }: FilterBarProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input placeholder="Search documents by title or reference..." className="pl-9" />
        </div>
        <Button variant="outline" className="text-slate-700">
          <Download className="w-4 h-4 mr-2" />
          Export Selected
        </Button>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        {/* Placeholders for selects */}
        <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600 bg-slate-50">Area</Button>
        <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600 bg-slate-50">Criterion</Button>
        <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600 bg-slate-50">Faculty</Button>
        <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600 bg-slate-50">Status</Button>
        <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600 bg-slate-50">Tags</Button>
        <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600 bg-slate-50">Date Range</Button>
        
        <button className="text-xs text-blue-600 hover:underline ml-2 font-medium">
          Clear Filters
        </button>

        <div className="ml-auto text-sm text-slate-500">
          Showing <span className="font-medium text-slate-700">{totalResults}</span> documents
        </div>
      </div>
    </div>
  )
}
