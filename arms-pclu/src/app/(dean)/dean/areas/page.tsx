import { DeanAreasClient } from "./DeanAreasClient"
import { getAreas } from "@/actions/area.actions"
import { requireAdminOrDean } from "@/lib/auth/getUser"

export const metadata = {
  title: "Accreditation Areas | Dean Portal",
  description: "Manage PACUCOA areas, criterias, and indicators",
}

export default async function DeanAreasPage() {
  await requireAdminOrDean()
  
  const areasResult = await getAreas()
  const initialData = areasResult.success ? areasResult.data : []

  return (
    <>
      <DeanAreasClient initialData={initialData} />
    </>
  )
}
