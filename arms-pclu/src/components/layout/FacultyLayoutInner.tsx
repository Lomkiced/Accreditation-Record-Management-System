"use client"

import { FacultySidebar } from "@/components/layout/FacultySidebar"
import { TopHeader } from "@/components/layout/TopHeader"
import { useAuthStore } from "@/store/authStore"
import { usePathname } from "next/navigation"

export function FacultyLayoutInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()

  return (
    <div className="relative min-h-screen bg-[#F8FAFC]">
      <FacultySidebar user={user} />
      <TopHeader role="faculty" user={user} />
      <main className="ml-[240px] pt-16 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

