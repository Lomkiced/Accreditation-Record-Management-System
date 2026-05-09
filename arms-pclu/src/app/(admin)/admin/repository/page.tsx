"use client"

import * as React from "react"
import { Download, Tag } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { RepositoryTable, type Document } from "@/components/repository/RepositoryTable"
import { DocumentDetailPanel } from "@/components/repository/DocumentDetailPanel"
import { FilterBar } from "@/components/repository/FilterBar"

const mockDocuments: Document[] = [
  { 
    id: "DOC-2024-001", 
    title: "Faculty Development Plan 2024", 
    area: { number: 2, name: "Faculty" }, 
    criterion: "A. Academic Qualifications", 
    faculty: "Dr. Juan Perez",
    uploadedAt: "Oct 12, 2024", 
    tags: [{ id: "t1", name: "Priority", color: "#EF4444" }],
    status: "APPROVED" 
  },
  { 
    id: "DOC-2024-002", 
    title: "Library Holdings Inventory", 
    area: { number: 4, name: "Library" }, 
    criterion: "B. Collection", 
    faculty: "Maria Clara",
    uploadedAt: "Oct 11, 2024", 
    tags: [{ id: "t2", name: "For Review", color: "#F59E0B" }, { id: "t4", name: "Archived", color: "#64748B" }],
    status: "APPROVED" 
  },
  { 
    id: "DOC-2024-003", 
    title: "Student Handbook 2024", 
    area: { number: 7, name: "Student Services" }, 
    criterion: "A. Student Services", 
    faculty: "Elena Santos",
    uploadedAt: "Oct 09, 2024", 
    tags: [{ id: "t3", name: "Finalized", color: "#10B981" }],
    status: "APPROVED" 
  },
]

export default function RepositoryPage() {
  const [selectedDocument, setSelectedDocument] = React.useState<Document | null>(null)

  return (
    <>
      <PageHeader
        title="Document Repository"
        subtitle="Centralized storage of all approved accreditation documents"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="text-slate-700 bg-white">
              <Download className="w-4 h-4 mr-2" />
              Export Selected
            </Button>
            <Button variant="outline" className="text-slate-700 bg-white">
              <Tag className="w-4 h-4 mr-2" />
              Bulk Tag
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <FilterBar totalResults={mockDocuments.length} />

        <RepositoryTable 
          data={mockDocuments} 
          onRowClick={setSelectedDocument}
        />
      </div>

      <DocumentDetailPanel 
        open={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        document={selectedDocument}
      />
    </>
  )
}
