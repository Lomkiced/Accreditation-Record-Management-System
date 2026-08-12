import { AdminUsersClient } from "./AdminUsersClient"
import { getUsers } from "@/actions/user.actions"
import { requireRole } from "@/actions/auth.actions"

export const metadata = {
  title: "User Management | Admin Portal",
  description: "Manage system administrators and deans",
}

export default async function AdminUsersPage() {
  await requireRole(["ADMIN"])
  
  // Fetch initial data on the server
  const usersResult = await getUsers(["ADMIN", "DEAN"])
  const initialData = usersResult.success ? usersResult.data : []

  return (
    <>
      <AdminUsersClient initialData={initialData} />
    </>
  )
}
