"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "ADMIN" | "FACULTY"
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuthStore()
  const [showContent, setShowContent] = useState(false)

  // Production-safe: debug logging removed

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated || !user) {
      router.replace("/login")
      return
    }

    if (requiredRole && user.role !== requiredRole) {
      const fallback =
        user.role === "ADMIN" ? "/admin/dashboard" : "/faculty/dashboard"
      router.replace(fallback)
      return
    }

    setShowContent(true)
  }, [isLoading, isAuthenticated, user, requiredRole, router])

  if (isLoading || !showContent) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex">
        <div className="w-[240px] bg-[#0F172A] fixed h-screen flex-shrink-0" />

        <div className="ml-[240px] flex-1 pt-16">
          <div className="fixed top-0 left-[240px] right-0 h-16 bg-white border-b border-slate-200 z-30" />

          <div className="p-6 space-y-4">
            <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />

            <div className="grid grid-cols-4 gap-4 mt-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse"
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="col-span-2 h-80 bg-white rounded-xl border border-slate-200 animate-pulse" />
              <div className="h-80 bg-white rounded-xl border border-slate-200 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
