import { DeanAssignmentsClient } from "./DeanAssignmentsClient"
import { getFacultyWithAssignmentCounts } from "@/actions/assignment.actions"
import { requireAdminOrDean } from "@/lib/auth/getUser"

export const metadata = {
  title: "Area Assignments | Dean Portal",
  description: "Assign PACUCOA areas and criteria to faculty members",
}

export default async function DeanAssignmentsPage() {
  await requireAdminOrDean()
  
  const facultiesResult = await getFacultyWithAssignmentCounts()
  const initialData = facultiesResult.success ? facultiesResult.data : []

  return (
    <>
      <DeanAssignmentsClient initialData={initialData} />
    </>
  )
}
