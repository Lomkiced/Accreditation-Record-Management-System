import { DeanTagsClient } from "./DeanTagsClient"
import { getTagsWithUsage } from "@/actions/tag.actions"
import { requireRole } from "@/actions/auth.actions"

export const metadata = {
  title: "Tag Management | Dean Portal",
  description: "Organize accreditation documents with custom tags",
}

export default async function DeanTagsPage() {
  await requireRole(["DEAN", "ADMIN"])
  
  const tagsResult = await getTagsWithUsage()
  const initialData = tagsResult.success ? tagsResult.data : []

  return (
    <>
      <DeanTagsClient initialData={initialData} />
    </>
  )
}
