"use client"

import * as React from "react"
import { 
  FileText, 
  RotateCcw,
  Trash2,
  AlertCircle,
  Search,
  X,
  LayoutGrid,
  List,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Archive,
  HardDrive,
  Calendar,
  Layers,
  ExternalLink
} from "lucide-react"
import { useArchivedDocuments, useRestoreDocument, usePermanentlyDeleteDocument } from "@/hooks/useArchives"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const delta = 1
  const range: (number | string)[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i)
    } else if (range[range.length - 1] !== "...") {
      range.push("...")
    }
  }
  return range
}

type SortOption = "date-desc" | "date-asc" | "title-asc" | "title-desc" | "size-desc" | "size-asc"
type ViewMode = "grid" | "table"

export function ArchivesClient() {
  const { data: rawDocuments = [], isLoading } = useArchivedDocuments()
  const { mutate: restoreDoc, isPending: isRestoring } = useRestoreDocument()
  const { mutate: deleteDoc, isPending: isDeleting } = usePermanentlyDeleteDocument()

  const [documentToDelete, setDocumentToDelete] = React.useState<string | null>(null)
  const [restoringId, setRestoringId] = React.useState<string | null>(null)

  // Filters, Search, Sort & View Mode
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortOption, setSortOption] = React.useState<SortOption>("date-desc")
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(12)

  const documents = React.useMemo(() => (rawDocuments ?? []) as Array<{
    id: string
    title: string
    description?: string | null
    fileUrl?: string | null
    fileName?: string | null
    fileSize?: number | null
    documentDate?: Date | string | null
    version: number
    isArchived: boolean
    createdAt: Date | string
    updatedAt: Date | string
    mappings: Array<{
      id: string
      status: string
      indicator: {
        id: string
        name: string
        criterion?: {
          name: string
          area?: { name: string }
        }
      }
    }>
    tags?: Array<{ tag: { id: string; name: string; color: string } }>
  }>, [rawDocuments])

  // Quick summary stats
  const totalArchivedCount = documents.length
  const totalStorageBytes = React.useMemo(() => {
    return documents.reduce((acc, doc) => acc + (doc.fileSize || 0), 0)
  }, [documents])

  const lastArchivedDate = React.useMemo(() => {
    if (documents.length === 0) return null
    return new Date(documents[0].updatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }, [documents])

  // Filtered & Sorted Documents
  const filteredDocuments = React.useMemo(() => {
    let list = [...documents]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((doc) => {
        const titleMatch = doc.title?.toLowerCase().includes(q)
        const fileMatch = doc.fileName?.toLowerCase().includes(q)
        const descMatch = doc.description?.toLowerCase().includes(q)
        const tagMatch = doc.tags?.some((t) => t.tag.name.toLowerCase().includes(q))
        const mappingMatch = doc.mappings?.some(
          (m) =>
            m.indicator?.name.toLowerCase().includes(q) ||
            m.indicator?.criterion?.name.toLowerCase().includes(q) ||
            m.indicator?.criterion?.area?.name.toLowerCase().includes(q)
        )
        return titleMatch || fileMatch || descMatch || tagMatch || mappingMatch
      })
    }

    list.sort((a, b) => {
      switch (sortOption) {
        case "date-asc":
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        case "title-asc":
          return a.title.localeCompare(b.title)
        case "title-desc":
          return b.title.localeCompare(a.title)
        case "size-desc":
          return (b.fileSize || 0) - (a.fileSize || 0)
        case "size-asc":
          return (a.fileSize || 0) - (b.fileSize || 0)
        case "date-desc":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })

    return list
  }, [documents, searchQuery, sortOption])

  // Reset page when search or filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, sortOption, pageSize])

  // Pagination slicing
  const totalItems = filteredDocuments.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedDocs = filteredDocuments.slice(startIndex, endIndex)

  const handleRestore = (id: string) => {
    setRestoringId(id)
    restoreDoc(id, {
      onSettled: () => setRestoringId(null)
    })
  }

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      deleteDoc(documentToDelete, {
        onSuccess: () => setDocumentToDelete(null)
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 mt-4">
      {/* ─── SUMMARY STATS BAR ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Archived Documents</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalArchivedCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Storage Retained</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{formatBytes(totalStorageBytes)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Latest Activity</p>
            <p className="text-sm font-semibold text-slate-800 mt-1 truncate">
              {lastArchivedDate ? `Archived ${lastArchivedDate}` : "No activity"}
            </p>
          </div>
        </div>
      </div>

      {/* ─── SEARCH, SORT, AND VIEW CONTROLS ─────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search archived documents by title, file, tag, or indicator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9 h-9 text-sm bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 hidden md:inline">Sort:</span>
              <Select value={sortOption} onValueChange={(val: SortOption) => setSortOption(val)}>
                <SelectTrigger className="h-9 w-[180px] text-xs bg-white border-slate-200">
                  <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white text-xs">
                  <SelectItem value="date-desc">Recently Archived</SelectItem>
                  <SelectItem value="date-asc">Oldest Archived</SelectItem>
                  <SelectItem value="title-asc">Title: A to Z</SelectItem>
                  <SelectItem value="title-desc">Title: Z to A</SelectItem>
                  <SelectItem value="size-desc">File Size: Largest</SelectItem>
                  <SelectItem value="size-asc">File Size: Smallest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-7 w-8 p-0 rounded-md transition-all",
                  viewMode === "grid" ? "bg-white text-blue-600 shadow-xs font-semibold" : "text-slate-500 hover:text-slate-800"
                )}
                title="Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("table")}
                className={cn(
                  "h-7 w-8 p-0 rounded-md transition-all",
                  viewMode === "table" ? "bg-white text-blue-600 shadow-xs font-semibold" : "text-slate-500 hover:text-slate-800"
                )}
                title="Table View"
                aria-label="Table View"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filter / Results Subheader */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            {searchQuery ? (
              <>
                Found <strong className="text-slate-700">{totalItems}</strong> matching document{totalItems === 1 ? "" : "s"} for &ldquo;{searchQuery}&rdquo;
              </>
            ) : (
              <>
                Showing <strong className="text-slate-700">{totalItems}</strong> archived document{totalItems === 1 ? "" : "s"}
              </>
            )}
          </span>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Per page:</span>
            <Select 
              value={String(pageSize)} 
              onValueChange={(val) => setPageSize(Number(val))}
            >
              <SelectTrigger className="h-7 w-[70px] text-xs bg-slate-50 border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white text-xs">
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="48">48</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT: EMPTY STATES / GRID / TABLE ──────────────── */}
      {totalArchivedCount === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 border border-amber-100">
            <Archive className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Archive Vault is Empty</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            You currently have no archived documents. When you archive files from your active repository or submissions, they will be safely kept here.
          </p>
        </div>
      ) : totalItems === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <Search className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">No matching documents</h3>
          <p className="text-sm text-slate-500 max-w-sm mb-4">
            No archived files match &ldquo;{searchQuery}&rdquo;. Try using different keywords or clear your search.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSearchQuery("")}
            className="text-xs"
          >
            Clear Search
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* ─── GRID VIEW ────────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedDocs.map((doc) => (
            <div 
              key={doc.id} 
              className="group flex flex-col bg-white border border-slate-200 rounded-xl shadow-xs hover:shadow-md hover:border-slate-300 transition-all p-4 relative"
            >
              {/* Header: Icon + Title + Version */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100/60 flex items-center justify-center text-amber-700 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 
                      className="font-semibold text-sm text-slate-900 truncate flex-1" 
                      title={doc.title}
                    >
                      {doc.title}
                    </h4>
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      v{doc.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5" title={doc.fileName || ""}>
                    {doc.fileName || "No file uploaded"}
                  </p>
                </div>
              </div>

              {/* Metadata Info */}
              <div className="space-y-2.5 flex-1 text-xs">
                <div className="flex items-center justify-between text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100">
                  <span>Size: <strong className="text-slate-700 font-medium">{formatBytes(doc.fileSize)}</strong></span>
                  <span>Archived: <strong className="text-slate-700 font-medium">{new Date(doc.updatedAt).toLocaleDateString()}</strong></span>
                </div>

                {/* Tags if any */}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map((t) => (
                      <span 
                        key={t.tag.id}
                        className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border"
                        style={{
                          backgroundColor: `${t.tag.color}15`,
                          color: t.tag.color,
                          borderColor: `${t.tag.color}30`
                        }}
                      >
                        {t.tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Associated Mappings / Indicators */}
                {doc.mappings && doc.mappings.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <p className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-400" />
                      Associated Indicators ({doc.mappings.length}):
                    </p>
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                      {doc.mappings.map((m) => (
                        <span 
                          key={m.id} 
                          className="inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] text-slate-600 truncate max-w-full"
                          title={`${m.indicator.criterion?.area?.name || ""} > ${m.indicator.criterion?.name || ""} > ${m.indicator.name}`}
                        >
                          {m.indicator.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-200 transition-colors"
                    title="View file"
                    aria-label="View file"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-xs font-medium text-slate-700 hover:text-slate-900 border-slate-200"
                  onClick={() => handleRestore(doc.id)}
                  disabled={isRestoring || isDeleting}
                >
                  <RotateCcw className={cn("w-3.5 h-3.5 mr-1.5 text-slate-500", restoringId === doc.id && "animate-spin")} />
                  {restoringId === doc.id ? "Restoring..." : "Restore"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 bg-rose-50/30"
                  onClick={() => setDocumentToDelete(doc.id)}
                  disabled={isRestoring || isDeleting}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ─── TABLE VIEW ───────────────────────────────────────────── */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Associated Indicators</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Archived Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-[220px] truncate" title={doc.title}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="truncate">{doc.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-[180px] truncate" title={doc.fileName || ""}>
                      {doc.fileName || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        v{doc.version}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-[240px]">
                      <div className="flex flex-wrap gap-1">
                        {doc.mappings?.slice(0, 2).map((m) => (
                          <span 
                            key={m.id}
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] border border-slate-200 truncate max-w-[140px]"
                            title={m.indicator.name}
                          >
                            {m.indicator.name}
                          </span>
                        ))}
                        {doc.mappings && doc.mappings.length > 2 && (
                          <span className="text-[10px] font-semibold text-slate-400 self-center">
                            +{doc.mappings.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      {formatBytes(doc.fileSize)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                            title="Open File"
                            aria-label="Open File"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRestore(doc.id)}
                          disabled={isRestoring || isDeleting}
                          className="h-7 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <RotateCcw className={cn("w-3 h-3 mr-1 text-slate-500", restoringId === doc.id && "animate-spin")} />
                          Restore
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setDocumentToDelete(doc.id)}
                          disabled={isRestoring || isDeleting}
                          className="h-7 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── PAGINATION BAR ─────────────────────────────────────────── */}
      {totalItems > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <strong className="font-semibold text-slate-900">{startIndex + 1}</strong> to{" "}
            <strong className="font-semibold text-slate-900">{endIndex}</strong> of{" "}
            <strong className="font-semibold text-slate-900">{totalItems}</strong> documents
          </div>

          <div className="flex items-center gap-1">
            {/* First Page Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="h-8 w-8 p-0 border-slate-200"
              title="First Page"
              aria-label="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>

            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="h-8 w-8 p-0 border-slate-200"
              title="Previous Page"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1 mx-1">
              {getPageNumbers(safeCurrentPage, totalPages).map((p, idx) => {
                if (p === "...") {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 select-none">
                      …
                    </span>
                  )
                }
                const pageNum = p as number
                const isActive = pageNum === safeCurrentPage
                return (
                  <Button
                    key={pageNum}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "h-8 min-w-[32px] px-2 text-xs font-medium transition-all",
                      isActive
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="h-8 w-8 p-0 border-slate-200"
              title="Next Page"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            {/* Last Page Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className="h-8 w-8 p-0 border-slate-200"
              title="Last Page"
              aria-label="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── PERMANENT DELETION ALERT DIALOG ─────────────────────────── */}
      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600 font-bold text-base">
              <AlertCircle className="w-5 h-5" />
              Confirm Permanent Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600">
              Are you sure you want to permanently delete this archived document? This action cannot be undone. 
              The physical file and all associated historical version mappings will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
