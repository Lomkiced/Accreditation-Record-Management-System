"use client"

import * as React from "react"
import { Search, Loader2, FileText, ChevronDown } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { searchDocuments } from "@/actions/search.actions"
import { useAreas } from "@/hooks/useAreas"
import { useDebounce } from "@/hooks/useDebounce"

interface GlobalSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const [query, setQuery] = React.useState("")
  const [areaId, setAreaId] = React.useState("all")
  const debouncedQuery = useDebounce(query, 300)

  const { data: areas = [] } = useAreas()

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["search", debouncedQuery, areaId],
    queryFn: () => searchDocuments(debouncedQuery, areaId),
    enabled: open && debouncedQuery.length > 0,
  })

  // Reset state when closing
  React.useEffect(() => {
    if (!open) {
      setQuery("")
      setAreaId("all")
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0 bg-white shadow-xl border-slate-200">
        <div className="flex items-center border-b border-slate-200 bg-white p-2">
          <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents by title or filename..."
            className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base"
          />
          <div className="mr-2">
            <Select value={areaId} onValueChange={setAreaId}>
              <SelectTrigger className="w-[180px] h-9 bg-slate-50 border-slate-200">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-lg">
                <SelectItem value="all">All Areas</SelectItem>
                {areas.map(area => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {debouncedQuery.length === 0 ? (
            <div className="py-14 text-center text-sm text-slate-500">
              Start typing to search documents...
            </div>
          ) : isLoading ? (
            <div className="py-14 flex items-center justify-center text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="py-14 text-center text-sm text-slate-500">
              No documents found matching &quot;{debouncedQuery}&quot;
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {results.map(doc => (
                <button 
                  key={doc.id}
                  onClick={() => {
                    if (doc.fileUrl) {
                      window.open(doc.fileUrl, "_blank")
                    }
                  }}
                  className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-800 truncate">
                        {doc.title}
                      </h4>
                      <span className="text-[10px] font-medium bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full shrink-0">
                        {doc.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{doc.fileName || "No file"}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                      <span>{doc.areaName}</span>
                      <span>•</span>
                      <span>{doc.facultyName}</span>
                      <span>•</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
