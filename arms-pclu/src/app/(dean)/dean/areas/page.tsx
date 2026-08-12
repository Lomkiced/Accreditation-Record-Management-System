import { DeanAreasClient } from "./DeanAreasClient"
import { getAreas } from "@/actions/area.actions"
import { requireRole } from "@/actions/auth.actions"

export const metadata = {
  title: "Accreditation Areas | Dean Portal",
  description: "Manage PACUCOA areas, criterias, and indicators",
}

export default async function DeanAreasPage() {
  await requireRole(["DEAN", "ADMIN"])
  
  const areasResult = await getAreas()
  const initialData = areasResult.success ? areasResult.data : []

  return (
    <>
      <DeanAreasClient initialData={initialData} />
    </>
  )
}
