"use client"

import { NewAdminSidebar } from "@/components/layout/NewAdminSidebar"
import { TopHeader } from "@/components/layout/TopHeader"
import { useAuthStore } from "@/store/authStore"

export function NewAdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()

  return (
    <div className="relative min-h-screen bg-[#F8FAFC]">
      <NewAdminSidebar user={user} />
      <TopHeader role="admin" user={user} />
      <main className="ml-[240px] pt-16 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
