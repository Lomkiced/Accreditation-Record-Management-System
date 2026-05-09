"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AvatarInitials } from "@/components/shared/AvatarInitials"
import { cn } from "@/lib/utils"

export interface Faculty {
  id: string
  name: string
  department: string
  designation: string
  assignedCount: number
}

interface FacultyListProps {
  faculties: Faculty[]
  selectedId: string | null
  onSelect: (faculty: Faculty) => void
}

export function FacultyList({ faculties, selectedId, onSelect }: FacultyListProps) {
  const [searchTerm, setSearchTerm] = React.useState("")

  const filtered = faculties.filter((f) => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full max-h-[700px]">
      <div className="p-4 border-b border-slate-100 shrink-0">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
          Faculty Members
          <span className="bg-blue-100 text-blue-700 text-xs py-0.5 px-2 rounded-full font-bold">
            {faculties.length}
          </span>
        </h3>
        
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search faculty..." 
            className="pl-9 h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {filtered.map((faculty) => (
            <div
              key={faculty.id}
              onClick={() => onSelect(faculty)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-b border-transparent last:border-b-0",
                selectedId === faculty.id
                  ? "bg-blue-50 border-l-2 border-l-blue-500 rounded-l-none"
                  : "hover:bg-slate-50 border-b-slate-100"
              )}
            >
              <AvatarInitials name={faculty.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{faculty.name}</p>
                <p className="text-xs text-slate-500 truncate">{faculty.department}</p>
              </div>
              
              {faculty.assignedCount > 0 ? (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold shrink-0">
                  {faculty.assignedCount}
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0">
                  None
                </span>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-6 text-sm text-slate-500">
              No faculty found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
