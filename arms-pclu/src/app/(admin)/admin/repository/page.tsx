import * as React from "react"
import { PageHeader } from "@/components/shared/PageHeader"
import { getApprovedDocumentsByArea } from "@/actions/repository.actions"
import { AdminRepositoryView } from "@/components/repository/AdminRepositoryView"

export default async function AdminRepositoryPage() {
  const areasWithDocuments = await getApprovedDocumentsByArea()

  return (
    <>
      <PageHeader
        title="Document Repository"
        subtitle="Centralized storage of all approved accreditation documents, organized by Area"
      />

      <div className="mt-6 max-w-7xl">
        <AdminRepositoryView data={areasWithDocuments} />
      </div>
    </>
  )
}
