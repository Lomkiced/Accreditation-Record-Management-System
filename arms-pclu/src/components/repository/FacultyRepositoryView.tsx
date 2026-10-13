"use client"

import * as React from "react"
import {
  Search,
  FolderOpen,
  FileText,
  ExternalLink,
  Lock,
  CheckCircle2,
  Filter,
  Layers,
  Archive,
  Trash2,
  RotateCcw,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { useApprovedSubmissions } from "@/hooks/useSubmissions"
import {
  useArchiveDocument,
  useRestoreDocument,
  usePermanentlyDeleteDocument,
} from "@/hooks/useArchives"
import { useAuthStore } from "@/store/authStore"
import { Skeleton } from "@/components/ui/skeleton"

interface ApprovedDocItem {
  id: string
  title: string
  description?: string | null
  fileName: string | null
  fileUrl: string | null
  facultyName: string
  facultyId: string
  uploadedAt: Date
  isArchived: boolean
  mappings: {
    id: string
    indicatorId: string
    indicatorName: string
    criterionName: string
    areaName: string
    areaId: string
    isConfidential: boolean
  }[]
  isConfidential: boolean
}

export function FacultyRepositoryView() {
  const { data: rawSubmissions = [], isLoading } = useApprovedSubmissions()
  const { user } = useAuthStore()

  const [activeTab, setActiveTab] = React.useState<"active" | "archived">("active")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedArea, setSelectedArea] = React.useState<string>("all")

  const [documentToArchive, setDocumentToArchive] = React.useState<ApprovedDocItem | null>(null)
  const [documentToDeletePermanently, setDocumentToDeletePermanently] = React.useState<ApprovedDocItem | null>(null)

  const archiveMutation = useArchiveDocument()
  const restoreMutation = useRestoreDocument()
  const deletePermanentMutation = usePermanentlyDeleteDocument()

  // Group raw mappings by document ID
  const documents: ApprovedDocItem[] = React.useMemo(() => {
    const map = new Map<string, ApprovedDocItem>()

    for (const sub of rawSubmissions) {
      const doc = sub.document
      const ind = sub.indicator
      const crit = ind.criterion
      const isConfidential = Boolean((ind as any).isConfidential)

      if (!map.has(doc.id)) {
        map.set(doc.id, {
          id: doc.id,
          title: doc.title,
          description: doc.description,
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          facultyName: sub.user.name ?? "Faculty",
          facultyId: sub.userId,
          uploadedAt: new Date(doc.createdAt),
          isArchived: Boolean((doc as any).isArchived),
          mappings: [],
          isConfidential: false,
        })
      }

      const entry = map.get(doc.id)!
      if (isConfidential) {
        entry.isConfidential = true
      }

      entry.mappings.push({
        id: sub.id,
        indicatorId: ind.id,
        indicatorName: ind.name,
        criterionName: crit.name,
        areaName: crit.area.name,
        areaId: crit.area.id,
        isConfidential,
      })
    }

    return Array.from(map.values())
  }, [rawSubmissions])

  // Count active vs archived documents
  const activeDocs = React.useMemo(
    () => documents.filter((doc) => !doc.isArchived),
    [documents]
  )
  const archivedDocs = React.useMemo(
    () => documents.filter((doc) => doc.isArchived && doc.facultyId === user?.id),
    [documents, user?.id]
  )

  const currentTabDocs = activeTab === "active" ? activeDocs : archivedDocs

  // Extract unique areas for filtering based on current tab
  const availableAreas = React.useMemo(() => {
    const set = new Map<string, string>()
    for (const doc of currentTabDocs) {
      for (const m of doc.mappings) {
        if (!set.has(m.areaId)) {
          set.set(m.areaId, m.areaName)
        }
      }
    }
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }))
  }, [currentTabDocs])

  // Filter documents by search and area
  const filteredDocuments = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return currentTabDocs.filter((doc) => {
      const matchesArea =
        selectedArea === "all" ||
        doc.mappings.some((m) => m.areaId === selectedArea)

      if (!matchesArea) return false

      if (!q) return true

      return (
        doc.title.toLowerCase().includes(q) ||
        (doc.fileName && doc.fileName.toLowerCase().includes(q)) ||
        doc.facultyName.toLowerCase().includes(q) ||
        doc.mappings.some(
          (m) =>
            m.indicatorName.toLowerCase().includes(q) ||
            m.criterionName.toLowerCase().includes(q) ||
            m.areaName.toLowerCase().includes(q)
        )
      )
    })
  }, [currentTabDocs, searchQuery, selectedArea])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-white rounded-xl border border-slate-200 p-3 flex gap-3">
          <Skeleton className="h-full w-64" />
          <Skeleton className="h-full w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher: Active Approved vs Archived Approved */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("active")
              setSelectedArea("all")
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "active"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active Repository
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 h-4 ${
                activeTab === "active"
                  ? "bg-blue-700 text-white border-transparent"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {activeDocs.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("archived")
              setSelectedArea("all")
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "archived"
                ? "bg-amber-600 text-white shadow-sm shadow-amber-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            Repository Archives
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 h-4 ${
                activeTab === "archived"
                  ? "bg-amber-700 text-white border-transparent"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {archivedDocs.length}
            </Badge>
          </button>
        </div>

        <span className="text-xs text-slate-400">
          {activeTab === "active"
            ? "Verified evidence published to the repository"
            : "Your deleted/archived repository documents"}
        </span>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder={
              activeTab === "active"
                ? "Search approved documents, faculty, or indicators..."
                : "Search your archived repository documents..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="w-full sm:w-[220px]">
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-xs">
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Areas ({currentTabDocs.length})</SelectItem>
              {availableAreas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs font-semibold text-slate-500 whitespace-nowrap px-2">
          {filteredDocuments.length} {activeTab === "active" ? "Approved" : "Archived"}{" "}
          {filteredDocuments.length === 1 ? "Item" : "Items"}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 border-dashed p-12 text-center shadow-xs">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
            {activeTab === "active" ? (
              <FolderOpen className="w-6 h-6" />
            ) : (
              <Archive className="w-6 h-6 text-amber-500" />
            )}
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            {activeTab === "active"
              ? "No approved evidence found"
              : "No archived repository documents"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedArea !== "all"
              ? "Try adjusting your search query or area filter."
              : activeTab === "active"
              ? "Approved accreditation evidence will appear here once verified by the Dean."
              : "Approved documents you delete will appear in this archive."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const isOwner = user?.id === doc.facultyId
            const isRestricted = doc.isConfidential && !isOwner && user?.role === "FACULTY"

            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          activeTab === "active"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {doc.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          By {doc.facultyName} • {doc.uploadedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {doc.isConfidential ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full shrink-0">
                        <Lock className="w-3 h-3" />
                        Confidential
                      </span>
                    ) : activeTab === "active" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                        <Archive className="w-3 h-3" />
                        Archived
                      </span>
                    )}
                  </div>

                  {doc.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                      {doc.description}
                    </p>
                  )}

                  {/* Mapped Indicators Pill List */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Mapped Evidence
                    </span>
                    <div className="space-y-1">
                      {doc.mappings.map((m) => (
                        <div
                          key={m.id}
                          className="bg-slate-50 border border-slate-200/80 rounded-md p-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-semibold text-blue-600 truncate">
                              {m.areaName}
                            </span>
                            {m.isConfidential && (
                              <span className="text-[9px] text-rose-600 font-bold flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Confidential
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 font-medium text-[11px] truncate mt-0.5">
                            {m.indicatorName}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-medium truncate max-w-[130px]">
                    {doc.fileName || "No file"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* View File Button */}
                    {isRestricted ? (
                      <span className="text-[11px] font-medium text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-md flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Restricted
                      </span>
                    ) : doc.fileUrl ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(doc.fileUrl!, "_blank")}
                        className="h-8 text-xs font-medium text-slate-700 hover:text-blue-600"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        View
                      </Button>
                    ) : null}

                    {/* Active tab: Owner can delete (move to archive) */}
                    {activeTab === "active" && isOwner && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDocumentToArchive(doc)}
                        className="h-8 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 px-2"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </Button>
                    )}

                    {/* Archived tab: Owner can restore or permanently delete */}
                    {activeTab === "archived" && isOwner && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => restoreMutation.mutate(doc.id)}
                          disabled={restoreMutation.isPending}
                          className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2"
                          title="Restore to active repository"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDocumentToDeletePermanently(doc)}
                          className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2"
                          title="Permanently remove from personal list"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete / Archive Confirmation Modal */}
      <AlertDialog
        open={!!documentToArchive}
        onOpenChange={(open) => !open && setDocumentToArchive(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Approved Document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{documentToArchive?.title}&quot; from your
              active repository? It will be moved to your repository archive and can be
              restored or permanently removed at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (documentToArchive) {
                  archiveMutation.mutate(documentToArchive.id)
                  setDocumentToArchive(null)
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanently Delete Confirmation Modal */}
      <AlertDialog
        open={!!documentToDeletePermanently}
        onOpenChange={(open) => !open && setDocumentToDeletePermanently(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{documentToDeletePermanently?.title}&quot; from
              your personal view. The document remains safely preserved in the institutional
              accreditation repository for compliance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (documentToDeletePermanently) {
                  deletePermanentMutation.mutate(documentToDeletePermanently.id)
                  setDocumentToDeletePermanently(null)
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
