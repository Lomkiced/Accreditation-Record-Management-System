"use client"

import * as React from "react"
import { Search, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FilterBarProps {
  totalResults: number
  searchQuery: string
  onSearchChange: (val: string) => void
  tags: { id: string; name: string }[]
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  filterOptions: {
    areas: string[]
    criteria: string[]
    faculties: string[]
    statuses: string[]
  }
  selectedAreas: string[]
  onAreasChange: (areas: string[]) => void
  selectedCriteria: string[]
  onCriteriaChange: (criteria: string[]) => void
  selectedFaculties: string[]
  onFacultiesChange: (faculties: string[]) => void
  selectedStatuses: string[]
  onStatusesChange: (statuses: string[]) => void
  dateRange: string
  onDateRangeChange: (range: string) => void
}

export function FilterBar(props: FilterBarProps) {
  const {
    totalResults,
    searchQuery,
    onSearchChange,
    tags,
    selectedTags,
    onTagsChange,
    filterOptions,
    selectedAreas,
    onAreasChange,
    selectedCriteria,
    onCriteriaChange,
    selectedFaculties,
    onFacultiesChange,
    selectedStatuses,
    onStatusesChange,
    dateRange,
    onDateRangeChange,
  } = props

  const hasFilters =
    searchQuery ||
    selectedTags.length > 0 ||
    selectedAreas.length > 0 ||
    selectedCriteria.length > 0 ||
    selectedFaculties.length > 0 ||
    selectedStatuses.length > 0 ||
    dateRange !== "all"

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search documents by title or file name..." 
            className="pl-9" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button variant="outline" className="text-slate-700">
          <Download className="w-4 h-4 mr-2" />
          Export Selected
        </Button>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        
        {/* AREA */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600 bg-slate-50">
              Area
              {selectedAreas.length > 0 && ` (${selectedAreas.length})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 max-h-60 overflow-y-auto">
            {filterOptions.areas.map((area) => (
              <DropdownMenuCheckboxItem
                key={area}
                checked={selectedAreas.includes(area)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onAreasChange([...selectedAreas, area])
                  } else {
                    onAreasChange(selectedAreas.filter((a) => a !== area))
                  }
                }}
              >
                {area}
              </DropdownMenuCheckboxItem>
            ))}
            {filterOptions.areas.length === 0 && (
              <div className="px-2 py-1.5 text-xs text-slate-500">No areas found</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* CRITERION */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600 bg-slate-50">
              Criterion
              {selectedCriteria.length > 0 && ` (${selectedCriteria.length})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 max-h-60 overflow-y-auto">
            {filterOptions.criteria.map((criterion) => (
              <DropdownMenuCheckboxItem
                key={criterion}
                checked={selectedCriteria.includes(criterion)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onCriteriaChange([...selectedCriteria, criterion])
                  } else {
                    onCriteriaChange(selectedCriteria.filter((c) => c !== criterion))
                  }
                }}
              >
                {criterion}
              </DropdownMenuCheckboxItem>
            ))}
            {filterOptions.criteria.length === 0 && (
              <div className="px-2 py-1.5 text-xs text-slate-500">No criteria found</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* FACULTY */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600 bg-slate-50">
              Faculty
              {selectedFaculties.length > 0 && ` (${selectedFaculties.length})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 max-h-60 overflow-y-auto">
            {filterOptions.faculties.map((faculty) => (
              <DropdownMenuCheckboxItem
                key={faculty}
                checked={selectedFaculties.includes(faculty)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onFacultiesChange([...selectedFaculties, faculty])
                  } else {
                    onFacultiesChange(selectedFaculties.filter((f) => f !== faculty))
                  }
                }}
              >
                {faculty}
              </DropdownMenuCheckboxItem>
            ))}
            {filterOptions.faculties.length === 0 && (
              <div className="px-2 py-1.5 text-xs text-slate-500">No faculty found</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* STATUS */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600 bg-slate-50">
              Status
              {selectedStatuses.length > 0 && ` (${selectedStatuses.length})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 max-h-60 overflow-y-auto">
            {filterOptions.statuses.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={selectedStatuses.includes(status)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onStatusesChange([...selectedStatuses, status])
                  } else {
                    onStatusesChange(selectedStatuses.filter((s) => s !== status))
                  }
                }}
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}
            {filterOptions.statuses.length === 0 && (
              <div className="px-2 py-1.5 text-xs text-slate-500">No statuses found</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* CLASSIFICATIONS (TAGS) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600 bg-slate-50">
              Classifications
              {selectedTags.length > 0 && ` (${selectedTags.length})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 max-h-60 overflow-y-auto">
            {tags.map((tag) => (
              <DropdownMenuCheckboxItem
                key={tag.id}
                checked={selectedTags.includes(tag.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onTagsChange([...selectedTags, tag.id])
                  } else {
                    onTagsChange(selectedTags.filter((id) => id !== tag.id))
                  }
                }}
              >
                {tag.name}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuCheckboxItem
              checked={selectedTags.includes("unlabeled")}
              onCheckedChange={(checked) => {
                if (checked) {
                  onTagsChange([...selectedTags, "unlabeled"])
                } else {
                  onTagsChange(selectedTags.filter((id) => id !== "unlabeled"))
                }
              }}
            >
              Unlabeled
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* DATE RANGE */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs text-slate-600 bg-slate-50">
              Date: {
                dateRange === "7days" ? "Last 7 Days" :
                dateRange === "30days" ? "Last 30 Days" :
                dateRange === "year" ? "This Year" : "All Time"
              }
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuCheckboxItem
              checked={dateRange === "all"}
              onCheckedChange={() => onDateRangeChange("all")}
            >
              All Time
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={dateRange === "7days"}
              onCheckedChange={() => onDateRangeChange("7days")}
            >
              Last 7 Days
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={dateRange === "30days"}
              onCheckedChange={() => onDateRangeChange("30days")}
            >
              Last 30 Days
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={dateRange === "year"}
              onCheckedChange={() => onDateRangeChange("year")}
            >
              This Year
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {hasFilters && (
          <button 
            className="text-xs text-blue-600 hover:underline ml-2 font-medium"
            onClick={() => {
              onSearchChange("")
              onTagsChange([])
              onAreasChange([])
              onCriteriaChange([])
              onFacultiesChange([])
              onStatusesChange([])
              onDateRangeChange("all")
            }}
          >
            Clear Filters
          </button>
        )}

        <div className="ml-auto text-sm text-slate-500">
          Showing <span className="font-medium text-slate-700">{totalResults}</span> documents
        </div>
      </div>
    </div>
  )
}
