"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderOpen,
  FileCheck,
  BookMarked,
  Bell,
  UserCircle,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AvatarInitials } from "../shared/AvatarInitials"
import { useAuth } from "@/hooks/useAuth"
import type { StoredUser } from "@/store/authStore"

const navItems = [
  { name: "Dashboard",       href: "/faculty/dashboard",    icon: LayoutDashboard },
  { name: "My Areas",        href: "/faculty/my-areas",     icon: FolderOpen },
  { name: "My Submissions",  href: "/faculty/my-submissions",  icon: FileCheck },
  { name: "Logbook",         href: "/faculty/logbook",      icon: BookMarked },
  { name: "Notifications",   href: "/faculty/notifications", icon: Bell },
  { name: "Profile",         href: "/faculty/profile",      icon: UserCircle },
]

interface FacultySidebarProps {
  user?: Pick<StoredUser, "name" | "department"> | null
}

export function FacultySidebar({ user: serverUser }: FacultySidebarProps) {
  const pathname = usePathname()
  const { user: storeUser, signOut } = useAuth()

  const displayName = serverUser?.name ?? storeUser?.name ?? "Faculty"
  const displayDept = serverUser?.department ?? storeUser?.department ?? "Department"

  return (
    <aside className="sidebar-fixed bg-[#0F172A] flex flex-col">
      <div className="h-16 flex items-center px-4 border-b border-slate-700/50 flex-shrink-0">
        <Link href="/faculty/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold text-white tracking-tight">ARMS</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5"></span>
        </Link>
        <span className="text-xs text-slate-400 ml-auto">PCLU</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                "text-sm font-medium transition-all duration-150",
                "group relative",
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="flex-shrink-0 border-t border-slate-700/50 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1">
          <AvatarInitials name={displayName} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-slate-400 truncate">{displayDept}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all duration-150"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
