"use client"

import * as React from "react"

import { PageHeader } from "@/components/shared/PageHeader"
import {
  RepositoryTable,
  type RepositoryDocument,
  getDominantStatus,
} from "@/components/repository/RepositoryTable"
import { DocumentDetailPanel } from "@/components/repository/DocumentDetailPanel"
import { FilterBar } from "@/components/repository/FilterBar"
import {
  useApprovedSubmissions,
  useArchiveDocumentFromRepository,
  useRestoreDocumentToRepository,
} from "@/hooks/useSubmissions"
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
import { Badge } from "@/components/ui/badge"
import { Archive, CheckCircle2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { getApprovedSubmissions } from "@/actions/submission.actions"

type ApprovedSubmissionsData = Extract<
  Awaited<ReturnType<typeof getApprovedSubmissions>>,
  { success: true }
>["data"]

export function DeanRepositoryClient({
  initialData,
}: {
  initialData: ApprovedSubmissionsData
}) {
  const [activeTab, setActiveTab] = React.useState<"active" | "archived">("active")
  const [selectedDocument, setSelectedDocument] = React.useState<RepositoryDocument | null>(null)
  const [documentToArchive, setDocumentToArchive] = React.useState<RepositoryDocument | null>(null)

  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedAreas, setSelectedAreas] = React.useState<string[]>([])
  const [selectedCriteria, setSelectedCriteria] = React.useState<string[]>([])
  const [selectedFaculties, setSelectedFaculties] = React.useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([])
  const [dateRange, setDateRange] = React.useState<string>("all")

  const { data: activeSubmissions = [], isLoading: isLoadingActive } =
    useApprovedSubmissions(initialData, false)
  const { data: archivedSubmissions = [], isLoading: isLoadingArchived } =
    useApprovedSubmissions(undefined, true)

  const archiveMutation = useArchiveDocumentFromRepository()
  const restoreMutation = useRestoreDocumentToRepository()

  const submissions = activeTab === "active" ? activeSubmissions : archivedSubmissions
  const isLoading = activeTab === "active" ? isLoadingActive : isLoadingArchived

  const activeCount = React.useMemo(() => {
    return new Set(activeSubmissions.map((s) => s.document.id)).size
  }, [activeSubmissions])

  const archivedCount = React.useMemo(() => {
    return new Set(archivedSubmissions.map((s) => s.document.id)).size
  }, [archivedSubmissions])

  // Group approved mappings by document ID
  const documents = React.useMemo(() => {
    const docMap = new Map<string, RepositoryDocument>()

    for (const sub of submissions) {
      if (!docMap.has(sub.document.id)) {
        const docTags =
          sub.document.tags?.map((t: any) => ({
            id: t.tag.id,
            name: t.tag.name,
            color: t.tag.color,
          })) || []

        docMap.set(sub.document.id, {
          id: sub.document.id,
          title: sub.document.title,
          fileName: sub.document.fileName,
          fileUrl: sub.document.fileUrl,
          faculty: sub.user.name ?? "Unknown Faculty",
          uploadedAt: new Date(sub.document.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          rawDate: new Date(sub.document.createdAt),
          mappings: [],
          tags: docTags,
          dominantStatus: "APPROVED",
        })
      }

      const doc = docMap.get(sub.document.id)!

      doc.mappings.push({
        id: sub.id,
        indicatorId: sub.indicator.id,
        indicatorName: sub.indicator.name,
        criterionName: sub.indicator.criterion.name,
        areaName: sub.indicator.criterion.area.name,
        status: sub.status,
      })
    }

    const result = Array.from(docMap.values())
    result.forEach((doc) => {
      doc.dominantStatus = getDominantStatus(doc.mappings)
    })

    return result
  }, [submissions])

  // Extract unique filter options from the available documents
  const filterOptions = React.useMemo(() => {
    const areas = new Set<string>()
    const criteria = new Set<string>()
    const faculties = new Set<string>()
    const statuses = new Set<string>()

    documents.forEach((doc) => {
      if (doc.faculty) faculties.add(doc.faculty)
      statuses.add(doc.dominantStatus)
      doc.mappings.forEach((m) => {
        if (m.areaName) areas.add(m.areaName)
        if (m.criterionName) criteria.add(m.criterionName)
      })
    })

    return {
      areas: Array.from(areas).sort(),
      criteria: Array.from(criteria).sort(),
      faculties: Array.from(faculties).sort(),
      statuses: Array.from(statuses).sort(),
    }
  }, [documents])

  // Filter based on search query, tags, and all other filters
  const filteredDocuments = React.useMemo(() => {
    let result = documents

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          (doc.fileName && doc.fileName.toLowerCase().includes(q))
      )
    }

    if (selectedAreas.length > 0) {
      result = result.filter((doc) =>
        doc.mappings.some((m) => selectedAreas.includes(m.areaName))
      )
    }

    if (selectedCriteria.length > 0) {
      result = result.filter((doc) =>
        doc.mappings.some((m) => selectedCriteria.includes(m.criterionName))
      )
    }

    if (selectedFaculties.length > 0) {
      result = result.filter((doc) => selectedFaculties.includes(doc.faculty))
    }

    if (selectedStatuses.length > 0) {
      result = result.filter((doc) =>
        selectedStatuses.includes(doc.dominantStatus)
      )
    }

    if (dateRange !== "all") {
      const selectedDateStr = new Date(dateRange).toISOString().split("T")[0]
      result = result.filter((doc) => {
        return doc.rawDate.toISOString().split("T")[0] === selectedDateStr
      })
    }

    return result
  }, [
    documents,
    searchQuery,
    selectedAreas,
    selectedCriteria,
    selectedFaculties,
    selectedStatuses,
    dateRange,
  ])

  // Update selected document reference if it changes in background
  React.useEffect(() => {
    if (selectedDocument) {
      const updated = documents.find((d) => d.id === selectedDocument.id)
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedDocument)) {
        setSelectedDocument(updated)
      }
    }
  }, [documents, selectedDocument])

  return (
    <>
      <PageHeader
        title="Document Repository"
        subtitle="Centralized storage of verified and approved accreditation documents"
        actions={null}
      />

      <div className="space-y-4">
        {/* Active vs Archived Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
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
                {activeCount}
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("archived")}
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
                {archivedCount}
              </Badge>
            </button>
          </div>

          <span className="text-xs text-slate-400">
            {activeTab === "active"
              ? "Verified evidence published in the repository"
              : "Documents removed from active institutional repository"}
          </span>
        </div>

        <FilterBar
          totalResults={filteredDocuments.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterOptions={filterOptions}
          selectedAreas={selectedAreas}
          onAreasChange={setSelectedAreas}
          selectedCriteria={selectedCriteria}
          onCriteriaChange={setSelectedCriteria}
          selectedFaculties={selectedFaculties}
          onFacultiesChange={setSelectedFaculties}
          selectedStatuses={selectedStatuses}
          onStatusesChange={setSelectedStatuses}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          hideStatusFilter={true}
        />

        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex gap-4 border-b border-slate-100 pb-4">
              <Skeleton className="h-6 w-full" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <RepositoryTable
            data={filteredDocuments}
            onRowClick={setSelectedDocument}
            activeTab={activeTab}
            onArchive={(doc) => setDocumentToArchive(doc)}
            onRestore={(doc) => restoreMutation.mutate(doc.id)}
          />
        )}
      </div>

      <DocumentDetailPanel
        open={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        document={selectedDocument}
      />

      {/* Delete / Archive from Repository Confirmation Modal */}
      <AlertDialog
        open={!!documentToArchive}
        onOpenChange={(open) => !open && setDocumentToArchive(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document from Repository?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{documentToArchive?.title}&quot; from the
              active repository? It will be moved to the repository archives. The document
              will remain intact in the faculty member&apos;s personal submissions.
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
              Delete from Repository
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
