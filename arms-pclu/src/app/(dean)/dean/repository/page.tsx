import { DeanRepositoryClient } from "./DeanRepositoryClient"
import { getAllSubmissions } from "@/actions/submission.actions"
import { requireAdminOrDean } from "@/lib/auth/getUser"

export const metadata = {
  title: "Document Repository | Dean Portal",
  description: "Centralized storage of all uploaded accreditation documents",
}

export default async function DeanRepositoryPage() {
  await requireAdminOrDean()
  
  const submissionsResult = await getAllSubmissions()
  const initialData = submissionsResult.success ? submissionsResult.data : []

  return (
    <>
      <DeanRepositoryClient initialData={initialData} />
    </>
  )
}
