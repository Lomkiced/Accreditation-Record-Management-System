import * as React from "react"
import { Search, Loader2, FileText, User, Mail, ExternalLink, BookOpen } from "lucide-react"
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
import { globalSearch } from "@/actions/search.actions"
import { useAreas } from "@/hooks/useAreas"
import { useDebounce } from "@/hooks/useDebounce"
import { AvatarInitials } from "@/components/shared/AvatarInitials"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"

interface GlobalSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const [query, setQuery] = React.useState("")
  const [areaId, setAreaId] = React.useState("all")
  const [activeTab, setActiveTab] = React.useState<"ALL" | "DOCUMENTS" | "FACULTIES">("ALL")
  const debouncedQuery = useDebounce(query, 150)
  const router = useRouter()
  const { user } = useAuthStore()

  const { data: areas = [] } = useAreas()

  // Cmd/Ctrl+K shortcut listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["global-search", debouncedQuery, areaId],
    queryFn: () => globalSearch(debouncedQuery, areaId),
    enabled: open && debouncedQuery.trim().length > 0,
    staleTime: 1000 * 60 * 5, // 5 min cache
    gcTime: 1000 * 60 * 10,
    placeholderData: (previousData) => previousData,
  })

  const documents = data?.documents || []
  const faculties = data?.faculties || []

  // Reset state when closing
  React.useEffect(() => {
    if (!open) {
      setQuery("")
      setAreaId("all")
      setActiveTab("ALL")
    }
  }, [open])

  const totalResults = documents.length + faculties.length

  const handleFacultyClick = (facultyEmail: string) => {
    if (user?.role === "DEAN") {
      onOpenChange(false)
      router.push(`/dean/assignments`)
    } else if (user?.role === "ADMIN") {
      onOpenChange(false)
      router.push(`/admin/users`)
    } else {
      navigator.clipboard.writeText(facultyEmail)
      toast.success(`Copied ${facultyEmail} to clipboard`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden gap-0 bg-white shadow-2xl border-slate-200 rounded-2xl">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-slate-200 bg-white p-2.5">
          <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents or faculty members... (Ctrl+K)"
            className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base"
            autoFocus
          />
          {isFetching && (
            <Loader2 className="w-4 h-4 animate-spin text-blue-500 mr-2 shrink-0" />
          )}
          <div className="mr-2">
            <Select value={areaId} onValueChange={setAreaId}>
              <SelectTrigger className="w-[160px] h-9 bg-slate-50 border-slate-200 text-xs font-medium">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-lg">
                <SelectItem value="all">All Areas</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab Filters (when results exist) */}
        {debouncedQuery.length > 0 && !isLoading && totalResults > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 bg-slate-50/60 text-xs font-medium">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === "ALL"
                  ? "bg-white shadow-xs text-blue-600 font-semibold border border-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All Results ({totalResults})
            </button>
            <button
              onClick={() => setActiveTab("DOCUMENTS")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === "DOCUMENTS"
                  ? "bg-white shadow-xs text-blue-600 font-semibold border border-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Documents ({documents.length})
            </button>
            <button
              onClick={() => setActiveTab("FACULTIES")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === "FACULTIES"
                  ? "bg-white shadow-xs text-blue-600 font-semibold border border-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Faculty ({faculties.length})
            </button>
          </div>
        )}

        {/* Results Container */}
        <div className="max-h-[460px] overflow-y-auto p-3 space-y-4">
          {debouncedQuery.length === 0 ? (
            <div className="py-14 text-center text-sm text-slate-400">
              Type keywords to search across documents, filenames, or faculty profiles...
            </div>
          ) : isLoading ? (
            <div className="py-14 flex items-center justify-center text-slate-500 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-600" />
              Searching records...
            </div>
          ) : totalResults === 0 ? (
            <div className="py-14 text-center text-sm text-slate-500">
              No documents or faculty found matching &quot;{debouncedQuery}&quot;
            </div>
          ) : (
            <div className="space-y-4">
              {/* Faculty Members Group */}
              {(activeTab === "ALL" || activeTab === "FACULTIES") && faculties.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      Faculty Members ({faculties.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {faculties.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => handleFacultyClick(f.email)}
                        className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-white hover:bg-blue-50/30 transition-all cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <AvatarInitials name={f.name} size="md" />
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                              {f.name}
                            </h4>
                            <p className="text-xs text-slate-500 truncate">
                              {f.department} • {f.designation}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-slate-400" />
                            {f.assignedAreasCount} {f.assignedAreasCount === 1 ? "Area" : "Areas"}
                          </span>
                          <span className="text-xs text-slate-400 group-hover:text-blue-600 transition-colors flex items-center gap-1 font-medium">
                            <Mail className="w-3.5 h-3.5" />
                            {f.email}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents Group */}
              {(activeTab === "ALL" || activeTab === "DOCUMENTS") && documents.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-500" />
                      Accreditation Documents ({documents.length})
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {documents.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          if (doc.fileUrl) {
                            window.open(doc.fileUrl, "_blank")
                          }
                        }}
                        className="w-full text-left flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/70 transition-all focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-2xs"
                      >
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold text-slate-800 truncate">
                              {doc.title}
                            </h4>
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full shrink-0 border border-slate-200">
                              {doc.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {doc.fileName || "No file attached"}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 font-medium">
                            <span className="text-slate-600">{doc.areaName}</span>
                            <span>•</span>
                            <span>{doc.facultyName}</span>
                            <span>•</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
