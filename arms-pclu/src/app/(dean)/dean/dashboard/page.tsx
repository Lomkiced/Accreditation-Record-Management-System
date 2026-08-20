import {
  getDashboardStats,
  getPendingSubmissions,
} from "@/actions/dashboard.actions"
import { requireDean } from "@/lib/auth/getUser"
import { DeanDashboardClient } from "./DeanDashboardClient"

export default async function DeanDashboardPage() {
  const dean = await requireDean()

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const [stats, pendingSubmissions] = await Promise.all([
    getDashboardStats(),
    getPendingSubmissions(),
  ])

  return (
    <DeanDashboardClient
      stats={stats}
      pendingSubmissions={pendingSubmissions}
      dean={dean}
      currentDate={currentDate}
    />
  )
}
