import { AdminAreasClient } from "./AdminAreasClient"
import { getAreas } from "@/actions/area.actions"
import { requireRole } from "@/actions/auth.actions"

export const metadata = {
  title: "Accreditation Areas | Admin Portal",
  description: "Manage PACUCOA areas, sub-areas, and indicators",
}

export default async function AdminAreasPage() {
  await requireRole(["ADMIN"])
  
  const areasResult = await getAreas()
  const initialData = areasResult.success ? areasResult.data : []

  return (
    <>
      <AdminAreasClient initialData={initialData} />
    </>
  )
}
