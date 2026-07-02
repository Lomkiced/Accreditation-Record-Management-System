"use client"

import * as React from "react"
import { Download, Tag } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { RepositoryTable, type RepositoryDocument, getDominantStatus } from "@/components/repository/RepositoryTable"
import { DocumentDetailPanel } from "@/components/repository/DocumentDetailPanel"
import { FilterBar } from "@/components/repository/FilterBar"
import { useAllSubmissions, useTags, useToggleTag } from "@/hooks/useSubmissions"
import { Skeleton } from "@/components/ui/skeleton"

export default function RepositoryPage() {
  const [selectedDocument, setSelectedDocument] = React.useState<RepositoryDocument | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const [selectedAreas, setSelectedAreas] = React.useState<string[]>([])
  const [selectedCriteria, setSelectedCriteria] = React.useState<string[]>([])
  const [selectedFaculties, setSelectedFaculties] = React.useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([])
  const [dateRange, setDateRange] = React.useState<string>("all")
  
  const { data: submissions = [], isLoading } = useAllSubmissions()
  const { data: tags = [] } = useTags()
  const toggleTag = useToggleTag()

  // Group mappings by document ID
  const documents = React.useMemo(() => {
    const docMap = new Map<string, RepositoryDocument>()

    for (const sub of submissions) {
      if (!docMap.has(sub.document.id)) {
        // Parse the relation
        const docTags = sub.document.tags?.map((t: any) => ({
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
          uploadedAt: new Date(sub.document.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          rawDate: new Date(sub.document.createdAt),
          mappings: [],
          tags: docTags,
          dominantStatus: "DRAFT" // Calculated below
        })
      }

      const doc = docMap.get(sub.document.id)!
      
      // Push the mapping summary
      doc.mappings.push({
        id: sub.id,
        indicatorId: sub.indicator.id,
        indicatorName: sub.indicator.name,
        criterionName: sub.indicator.criterion.name,
        areaName: sub.indicator.criterion.area.name,
        status: sub.status,
      })
    }

    // Calculate dominant status for each document
    const result = Array.from(docMap.values())
    result.forEach(doc => {
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

    documents.forEach(doc => {
      if (doc.faculty) faculties.add(doc.faculty)
      statuses.add(doc.dominantStatus)
      doc.mappings.forEach(m => {
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
      result = result.filter(doc => 
        doc.title.toLowerCase().includes(q) || 
        (doc.fileName && doc.fileName.toLowerCase().includes(q))
      )
    }

    if (selectedTags.length > 0) {
      result = result.filter(doc => {
        const isUnlabeled = selectedTags.includes("unlabeled")
        if (isUnlabeled && doc.tags.length === 0) return true
        return doc.tags.some(tag => selectedTags.includes(tag.id))
      })
    }

    if (selectedAreas.length > 0) {
      result = result.filter(doc => doc.mappings.some(m => selectedAreas.includes(m.areaName)))
    }

    if (selectedCriteria.length > 0) {
      result = result.filter(doc => doc.mappings.some(m => selectedCriteria.includes(m.criterionName)))
    }

    if (selectedFaculties.length > 0) {
      result = result.filter(doc => selectedFaculties.includes(doc.faculty))
    }

    if (selectedStatuses.length > 0) {
      result = result.filter(doc => selectedStatuses.includes(doc.dominantStatus))
    }

    if (dateRange !== "all") {
      const now = new Date()
      let cutoff = new Date(0)
      if (dateRange === "7days") cutoff = new Date(now.setDate(now.getDate() - 7))
      else if (dateRange === "30days") cutoff = new Date(now.setDate(now.getDate() - 30))
      else if (dateRange === "year") cutoff = new Date(now.setFullYear(now.getFullYear() - 1))
      
      result = result.filter(doc => doc.rawDate >= cutoff)
    }

    return result
  }, [documents, searchQuery, selectedTags, selectedAreas, selectedCriteria, selectedFaculties, selectedStatuses, dateRange])

  // Update selected document reference if it changes in background
  React.useEffect(() => {
    if (selectedDocument) {
      const updated = documents.find(d => d.id === selectedDocument.id)
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedDocument)) {
        setSelectedDocument(updated)
      }
    }
  }, [documents, selectedDocument])

  return (
    <>
      <PageHeader
        title="Document Repository"
        subtitle="Centralized storage of all uploaded accreditation documents"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="text-slate-700 bg-white shadow-sm">
              <Download className="w-4 h-4 mr-2" />
              Export Selected
            </Button>
            <Button variant="outline" className="text-slate-700 bg-white shadow-sm">
              <Tag className="w-4 h-4 mr-2" />
              Bulk Tag
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <FilterBar 
          totalResults={filteredDocuments.length} 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          tags={tags}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
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
        />

        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
             <div className="flex gap-4 border-b border-slate-100 pb-4">
               <Skeleton className="h-6 w-full" />
             </div>
             {[1, 2, 3, 4, 5].map(i => (
               <Skeleton key={i} className="h-12 w-full" />
             ))}
          </div>
        ) : (
          <RepositoryTable 
            data={filteredDocuments} 
            onRowClick={setSelectedDocument}
          />
        )}
      </div>

      <DocumentDetailPanel 
        open={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        document={selectedDocument}
        allTags={tags}
        onTagChange={(docId, tagId, add) => toggleTag.mutate({ documentId: docId, tagId, add })}
      />
    </>
  )
}
