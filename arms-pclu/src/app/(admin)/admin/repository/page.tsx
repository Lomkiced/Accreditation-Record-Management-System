import * as React from "react"
import { PageHeader } from "@/components/shared/PageHeader"
import { getApprovedDocumentsByArea } from "@/actions/repository.actions"
import { getRepositoryStorageQuota } from "@/actions/storage.actions"
import { AdminRepositoryView } from "@/components/repository/AdminRepositoryView"
import { StorageMeter } from "@/components/shared/StorageMeter"

export default async function AdminRepositoryPage() {
  const [areasWithDocuments, quotaRes] = await Promise.all([
    getApprovedDocumentsByArea(),
    getRepositoryStorageQuota(),
  ])

  return (
    <>
      <PageHeader
        title="Document Repository"
        subtitle="Centralized storage of all approved accreditation documents, organized by Area"
      />

      <div className="mt-6 max-w-7xl space-y-6">
        <StorageMeter
          quota={quotaRes.success ? quotaRes.data : undefined}
          title="Dean & Admin Institutional Repository Storage"
          description="1 GB Shared Quota · Preserves verified accreditation evidence across all Areas"
        />
        <AdminRepositoryView data={areasWithDocuments} />
      </div>
    </>
  )
}

