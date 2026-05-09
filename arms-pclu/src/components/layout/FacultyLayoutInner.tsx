"use client"

import { FacultySidebar } from "@/components/layout/FacultySidebar"
import { TopHeader } from "@/components/layout/TopHeader"
import { useAuthStore } from "@/store/authStore"
import { usePathname } from "next/navigation"

const pageTitles: Record<string, string> = {
  "/faculty/dashboard": "Dashboard",
  "/faculty/my-areas": "My Areas",
  "/faculty/my-submissions": "My Submissions",
  "/faculty/my-logbook": "My Logbook",
  "/faculty/notifications": "Notifications",
}

export function FacultyLayoutInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const pathname = usePathname()

  const pageTitle = pageTitles[pathname] ?? "Faculty Portal"

  return (
    <div className="relative min-h-screen bg-[#F8FAFC]">
      <FacultySidebar user={user} />
      <TopHeader title={pageTitle} role="faculty" user={user} />
      <main className="ml-[240px] pt-16 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

