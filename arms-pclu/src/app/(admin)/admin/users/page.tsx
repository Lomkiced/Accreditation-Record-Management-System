import { AdminUsersClient } from "./AdminUsersClient"
import { getUsers } from "@/actions/user.actions"
import { requireAdmin } from "@/lib/auth/getUser"

export const metadata = {
  title: "User Management | Admin Portal",
  description: "Manage system administrators and deans",
}

export default async function AdminUsersPage() {
  await requireAdmin()
  
  // Fetch initial data on the server
  const usersResult = await getUsers(["ADMIN", "DEAN"])
  const initialData = (usersResult.success ? usersResult.data : undefined) ?? []

  return (
    <>
      <AdminUsersClient initialData={initialData} />
    </>
  )
}
