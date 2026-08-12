import { AdminTagsClient } from "./AdminTagsClient"
import { getTagsWithUsage } from "@/actions/tag.actions"
import { requireRole } from "@/actions/auth.actions"

export const metadata = {
  title: "Tag Management | Admin Portal",
  description: "Organize accreditation documents with custom tags",
}

export default async function AdminTagsPage() {
  await requireRole(["ADMIN"])
  
  const tagsResult = await getTagsWithUsage()
  const initialData = tagsResult.success ? tagsResult.data : []

  return (
    <>
      <AdminTagsClient initialData={initialData} />
    </>
  )
}
