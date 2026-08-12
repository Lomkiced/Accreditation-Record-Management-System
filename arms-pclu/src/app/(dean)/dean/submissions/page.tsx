import { DeanSubmissionsClient } from "./DeanSubmissionsClient"
import { getAllSubmissions } from "@/actions/submission.actions"
import { requireAdminOrDean } from "@/lib/auth/getUser"

export const metadata = {
  title: "Document Submissions | Dean Portal",
  description: "Review and manage faculty document submissions",
}

export default async function DeanSubmissionsPage() {
  await requireAdminOrDean()
  
  const submissionsResult = await getAllSubmissions()
  const initialData = (submissionsResult.success ? submissionsResult.data : undefined) ?? []

  return (
    <>
      <DeanSubmissionsClient initialData={initialData} />
    </>
  )
}
