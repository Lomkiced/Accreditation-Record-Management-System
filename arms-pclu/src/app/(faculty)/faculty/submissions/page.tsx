import { requireUser } from "@/lib/auth/getUser"
import { getDocumentsForRepository } from "@/actions/document.actions"
import { SubmissionsClient } from "./SubmissionsClient"

export const metadata = {
  title: "My Submissions | Accreditation System",
}

export default async function SubmissionsPage() {
  // Enforce route protection
  await requireUser()

  // Fetch the user's documents
  const result = await getDocumentsForRepository()
  const documents = result.success && result.data ? result.data : []

  return <SubmissionsClient documents={documents} />
}
