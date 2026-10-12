"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Archive,
  Bell,
  UserCircle,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AvatarInitials } from "../shared/AvatarInitials"
import { useAuth } from "@/hooks/useAuth"
import { usePrefetch } from "@/hooks/usePrefetch"
import type { StoredUser } from "@/store/authStore"

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

interface NavCategory {
  category: string
  items: NavItem[]
}

const facultyNavCategories: NavCategory[] = [
  {
    category: "My Workspace",
    items: [
      { name: "Dashboard", href: "/faculty/dashboard", icon: LayoutDashboard },
      { name: "Assigned Areas", href: "/faculty/my-areas", icon: FolderOpen },
    ],
  },
  {
    category: "Evidence & Repository",
    items: [
      { name: "My Submissions", href: "/faculty/submissions", icon: FileText },
      { name: "Document Archives", href: "/faculty/archives", icon: Archive },
    ],
  },
  {
    category: "Account & Updates",
    items: [
      { name: "Notifications", href: "/faculty/notifications", icon: Bell },
      { name: "Faculty Profile", href: "/faculty/profile", icon: UserCircle },
    ],
  },
]

interface FacultySidebarProps {
  user?: Pick<StoredUser, "name" | "department" | "role"> | null
}

export function FacultySidebar({ user: serverUser }: FacultySidebarProps) {
  const pathname = usePathname()
  const { user: storeUser, signOut } = useAuth()
  const prefetch = usePrefetch()

  const displayName = serverUser?.name ?? storeUser?.name ?? "Academic Faculty"
  const displayDept = serverUser?.department ?? storeUser?.department ?? "Faculty Member"
  const userRole = serverUser?.role ?? storeUser?.role ?? "FACULTY"

  const isRouteActive = (href: string) => {
    if (href === "/faculty/dashboard") {
      return pathname === href
    }
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside className="sidebar-fixed bg-[#0B1120] border-r border-slate-800/80 flex flex-col select-none">
      {/* ── Brand Header ── */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 flex-shrink-0 bg-[#070D18]">
        <Link
          href="/faculty/dashboard"
          className="flex items-center gap-2.5 group transition-transform duration-150 active:scale-95"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.4)] ring-1 ring-emerald-400/40">
            <span className="text-sm font-black text-white tracking-wider">F</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-white tracking-tight leading-none group-hover:text-emerald-400 transition-colors">
              ARMS
            </span>
            <span className="text-[10px] font-medium text-slate-400 tracking-wider">
              FACULTY PORTAL
            </span>
          </div>
        </Link>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
          Faculty
        </span>
      </div>

      {/* ── Categorized Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto custom-scrollbar">
        {facultyNavCategories.map((group) => (
          <div key={group.category} className="space-y-1">
            <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-400 select-none flex items-center justify-between">
              <span>{group.category}</span>
              <div className="h-px flex-1 ml-2 bg-slate-800/60" />
            </div>

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = isRouteActive(item.href)
                const IconComponent = item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onMouseEnter={() => prefetch(item.href)}
                    onFocus={() => prefetch(item.href)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative group",
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-sm shadow-blue-900/30 ring-1 ring-blue-400/30"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    )}
                  >
                    {/* Active Accent Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-white rounded-r-full shadow-sm" />
                    )}

                    <IconComponent
                      className={cn(
                        "w-[18px] h-[18px] flex-shrink-0 transition-colors",
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-slate-200"
                      )}
                    />
                    <span className="truncate">{item.name}</span>

                    {item.badge && (
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User Footer Card ── */}
      <div className="flex-shrink-0 border-t border-slate-800/80 bg-[#070D18]/90 p-3 space-y-2">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800/60">
          <AvatarInitials
            name={displayName}
            role={userRole}
            size="sm"
            showGlow
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate leading-tight">
              {displayName}
            </p>
            <p className="text-xs text-slate-400 truncate leading-tight mt-0.5">
              {displayDept}
            </p>
          </div>
        </div>

        <button
          onClick={signOut}
          type="button"
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all duration-150 border border-transparent hover:border-rose-900/40"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
