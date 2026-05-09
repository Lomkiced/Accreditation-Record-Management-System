"use client"

import { AdminSidebar } from "@/components/layout/AdminSidebar"
import { TopHeader } from "@/components/layout/TopHeader"
import { useAuthStore } from "@/store/authStore"
import { usePathname } from "next/navigation"

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Admin Portal",
  "/admin/areas": "Areas & Criteria",
  "/admin/assignments": "Assignments",
  "/admin/submissions": "Submissions",
  "/admin/repository": "Document Repository",
  "/admin/tags": "Tag Management",
  "/admin/logbook": "Document Logbook",
  "/admin/reports": "Reports",
  "/admin/users": "Faculty Accounts",
  "/admin/audit-logs": "Audit Logs",
}

export function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const pathname = usePathname()

  const pageTitle =
    pageTitles[pathname] ??
    pageTitles[
      Object.keys(pageTitles).find((key) => pathname.startsWith(key)) ?? ""
    ] ??
    "Admin Portal"

  return (
    <div className="relative min-h-screen bg-[#F8FAFC]">
      <AdminSidebar user={user} />
      <TopHeader title={pageTitle} role="admin" user={user} />
      <main className="ml-[240px] pt-16 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

