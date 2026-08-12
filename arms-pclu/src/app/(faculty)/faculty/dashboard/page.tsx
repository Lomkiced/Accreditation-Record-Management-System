import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/getUser"
import { getAssignmentsForFaculty } from "@/actions/assignment.actions"
import { getAreas } from "@/actions/area.actions"
import { getMySubmissions } from "@/actions/submission.actions"
import { FacultyDashboardClient } from "./FacultyDashboardClient"

export const metadata = {
  title: "Faculty Dashboard | ARMS",
  description: "Manage your assigned PACUCOA areas and submissions",
}

export default async function FacultyDashboardPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== "FACULTY") {
    redirect("/auth/login")
  }

  // Fetch initial data in parallel on the server
  const [assignmentsResult, areasResult, submissionsResult] = await Promise.all([
    getAssignmentsForFaculty(user.id),
    getAreas(),
    getMySubmissions(),
  ])

  // Extract data or default to empty arrays
  const initialAssignments = assignmentsResult.success ? assignmentsResult.data : []
  const initialAreas = areasResult.success ? areasResult.data : []
  const initialSubmissions = submissionsResult.success ? submissionsResult.data : []

  return (
    <FacultyDashboardClient
      initialAssignments={initialAssignments}
      initialAreas={initialAreas}
      initialSubmissions={initialSubmissions}
    />
  )
}

