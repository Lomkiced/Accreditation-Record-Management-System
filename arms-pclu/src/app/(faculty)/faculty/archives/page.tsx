import * as React from "react"
import { PageHeader } from "@/components/shared/PageHeader"
import { ArchivesClient } from "./ArchivesClient"

export default function ArchivesPage() {
  return (
    <>
      <PageHeader
        title="Document Archives"
        subtitle="Manage your softly deleted documents. Restore them to your vault or permanently delete them."
      />
      
      <div className="max-w-7xl">
        <ArchivesClient />
      </div>
    </>
  )
}
