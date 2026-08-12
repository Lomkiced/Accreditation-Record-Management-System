import { DeanUsersClient } from "./DeanUsersClient"
import { getUsers } from "@/actions/user.actions"
import { requireRole } from "@/actions/auth.actions"

export const metadata = {
  title: "Faculty Accounts | Dean Portal",
  description: "Manage faculty member accounts and access",
}

export default async function DeanUsersPage() {
  await requireRole(["DEAN", "ADMIN"])
  
  // Fetch initial data on the server
  const usersResult = await getUsers(["FACULTY"])
  const initialData = usersResult.success ? usersResult.data : []

  return (
    <>
      <DeanUsersClient initialData={initialData} />
    </>
  )
}
