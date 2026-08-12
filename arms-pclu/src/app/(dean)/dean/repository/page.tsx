import { DeanRepositoryClient } from "./DeanRepositoryClient"
import { getAllSubmissions } from "@/actions/submission.actions"
import { requireRole } from "@/actions/auth.actions"

export const metadata = {
  title: "Document Repository | Dean Portal",
  description: "Centralized storage of all uploaded accreditation documents",
}

export default async function DeanRepositoryPage() {
  await requireRole(["DEAN", "ADMIN"])
  
  const submissionsResult = await getAllSubmissions()
  const initialData = submissionsResult.success ? submissionsResult.data : []

  return (
    <>
      <DeanRepositoryClient initialData={initialData} />
    </>
  )
}
