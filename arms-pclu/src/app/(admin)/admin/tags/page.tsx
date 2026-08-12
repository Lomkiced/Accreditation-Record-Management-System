import { AdminTagsClient } from "./AdminTagsClient"
import { getTagsWithUsage } from "@/actions/tag.actions"
import { requireAdmin } from "@/lib/auth/getUser"

export const metadata = {
  title: "Tag Management | Admin Portal",
  description: "Organize accreditation documents with custom tags",
}

export default async function AdminTagsPage() {
  await requireAdmin()
  
  const tagsResult = await getTagsWithUsage()
  const initialData = tagsResult.success ? tagsResult.data : []

  return (
    <>
      <AdminTagsClient initialData={initialData} />
    </>
  )
}
