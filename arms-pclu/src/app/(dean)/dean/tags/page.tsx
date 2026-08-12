import { DeanTagsClient } from "./DeanTagsClient"
import { getTagsWithUsage } from "@/actions/tag.actions"
import { requireAdminOrDean } from "@/lib/auth/getUser"

export const metadata = {
  title: "Tag Management | Dean Portal",
  description: "Organize accreditation documents with custom tags",
}

export default async function DeanTagsPage() {
  await requireAdminOrDean()
  
  const tagsResult = await getTagsWithUsage()
  const initialData = tagsResult.success ? tagsResult.data : []

  return (
    <>
      <DeanTagsClient initialData={initialData} />
    </>
  )
}
