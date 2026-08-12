import { DeanSubmissionsClient } from "./DeanSubmissionsClient"
import { getAllSubmissions } from "@/actions/submission.actions"
import { requireRole } from "@/actions/auth.actions"

export const metadata = {
  title: "Document Submissions | Dean Portal",
  description: "Review and manage faculty document submissions",
}

export default async function DeanSubmissionsPage() {
  await requireRole(["DEAN", "ADMIN"])
  
  const submissionsResult = await getAllSubmissions()
  const initialData = submissionsResult.success ? submissionsResult.data : []

  return (
    <>
      <DeanSubmissionsClient initialData={initialData} />
    </>
  )
}
