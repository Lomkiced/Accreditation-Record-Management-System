import { FacultyMyAreasClient } from "./FacultyMyAreasClient"
import { getAssignmentsForFaculty } from "@/actions/assignment.actions"
import { getAreas } from "@/actions/area.actions"
import { getMySubmissions } from "@/actions/submission.actions"
import { requireFaculty } from "@/lib/auth/getUser"

export const metadata = {
  title: "My Assigned Areas | Faculty Portal",
  description: "Manage and upload evidence for your assigned PACUCOA areas",
}

export default async function FacultyMyAreasPage() {
  const user = await requireFaculty()
  
  
  const userId = user?.id ?? ""
  
  const [assignmentsResult, areasResult, submissionsResult] = await Promise.all([
    getAssignmentsForFaculty(userId),
    getAreas(),
    getMySubmissions()
  ])
  
  const initialData = {
    assignments: assignmentsResult.data ?? [],
    areas: areasResult.data ?? [],
    submissions: submissionsResult.data ?? []
  }

  return (
    <>
      <FacultyMyAreasClient initialData={initialData} />
    </>
  )
}
