import { DeanUsersClient } from "./DeanUsersClient"
import { getUsers } from "@/actions/user.actions"
import { requireAdminOrDean } from "@/lib/auth/getUser"
import { Suspense } from "react"

export const metadata = {
  title: "Faculty Accounts | Dean Portal",
  description: "Manage faculty member accounts and access",
}

export default async function DeanUsersPage() {
  await requireAdminOrDean()
  
  // Fetch initial data on the server
  const usersResult = await getUsers(["FACULTY"])
  const initialData = usersResult

  return (
    <Suspense fallback={null}>
      <DeanUsersClient initialData={initialData} />
    </Suspense>
  )
}
