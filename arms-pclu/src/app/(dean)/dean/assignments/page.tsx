import { DeanAssignmentsClient } from "./DeanAssignmentsClient"
import { getFacultyWithAssignmentCounts } from "@/actions/assignment.actions"
import { requireRole } from "@/actions/auth.actions"

export const metadata = {
  title: "Area Assignments | Dean Portal",
  description: "Assign PACUCOA areas and criteria to faculty members",
}

export default async function DeanAssignmentsPage() {
  await requireRole(["DEAN", "ADMIN"])
  
  const facultiesResult = await getFacultyWithAssignmentCounts()
  const initialData = facultiesResult.success ? facultiesResult.data : []

  return (
    <>
      <DeanAssignmentsClient initialData={initialData} />
    </>
  )
}
