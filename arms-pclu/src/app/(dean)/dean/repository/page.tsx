import { DeanRepositoryClient } from "./DeanRepositoryClient"
import { getApprovedSubmissions } from "@/actions/submission.actions"
import { requireAdminOrDean } from "@/lib/auth/getUser"

export const metadata = {
  title: "Document Repository | Dean Portal",
  description: "Centralized storage of all approved accreditation documents",
}

export default async function DeanRepositoryPage() {
  await requireAdminOrDean()
  
  const submissionsResult = await getApprovedSubmissions()
  const initialData = (submissionsResult.success ? submissionsResult.data : undefined) ?? []

  return (
    <>
      <DeanRepositoryClient initialData={initialData} />
    </>
  )
}
