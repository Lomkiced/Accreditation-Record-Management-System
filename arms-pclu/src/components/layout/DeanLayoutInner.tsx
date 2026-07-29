"use client"

import { DeanSidebar } from "@/components/layout/DeanSidebar"
import { TopHeader } from "@/components/layout/TopHeader"
import { useAuthStore } from "@/store/authStore"

export function DeanLayoutInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()

  return (
    <div className="relative min-h-screen bg-[#F8FAFC]">
      <DeanSidebar user={user} />
      <TopHeader role="dean" user={user} />
      <main className="ml-[240px] pt-16 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
