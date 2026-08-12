import { AdminAreasClient } from "./AdminAreasClient"
import { getAreas } from "@/actions/area.actions"
import { requireAdmin } from "@/lib/auth/getUser"

export const metadata = {
  title: "Accreditation Areas | Admin Portal",
  description: "Manage PACUCOA areas, sub-areas, and indicators",
}

export default async function AdminAreasPage() {
  await requireAdmin()
  
  const areasResult = await getAreas()
  const initialData = (areasResult.success ? areasResult.data : undefined) ?? []

  return (
    <>
      <AdminAreasClient initialData={initialData} />
    </>
  )
}
