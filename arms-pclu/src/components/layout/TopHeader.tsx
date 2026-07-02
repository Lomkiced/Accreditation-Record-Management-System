"use client"

import * as React from "react"
import Link from "next/link"
import { Search, Bell, ChevronDown, LogOut, UserCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { AvatarInitials } from "../shared/AvatarInitials"
import { useAuth } from "@/hooks/useAuth"
import { useNotifications, useMarkAsRead } from "@/hooks/useNotifications"
import type { StoredUser } from "@/store/authStore"
import { useRouter } from "next/navigation"

interface TopHeaderProps {
  role: "admin" | "faculty"
  /** Optional server-prefetched user — falls back to Zustand store */
  user?: Pick<StoredUser, "name" | "role" | "email"> | null
}

export function TopHeader({ role, user: serverUser }: TopHeaderProps) {
  const { user: storeUser, signOut } = useAuth()

  const displayUser = serverUser ?? storeUser
  const displayName = displayUser?.name ?? (role === "admin" ? "Admin" : "Faculty")
  const displayEmail = displayUser?.email ?? ""

  const profileHref = role === "admin" ? "/admin/profile" : "/faculty/profile"
  const notifHref = role === "admin" ? "/admin/notifications" : "/faculty/notifications"

  const { data: notifications = [] } = useNotifications()
  const { mutate: markAsRead } = useMarkAsRead()
  const router = useRouter()

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const topNotifications = notifications.slice(0, 5)

  const handleNotificationClick = (id: string, link: string | null) => {
    markAsRead(id)
    if (link) {
      router.push(link)
    }
  }

  return (
    <header className="header-fixed flex items-center justify-end px-6">


      <div className="flex items-center gap-2">
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} New
                </span>
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {topNotifications.length > 0 ? (
                topNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.id, notif.link)}
                    className={`p-3 text-sm border-b cursor-pointer hover:bg-slate-50 transition-colors ${
                      !notif.isRead ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <p className="font-medium text-slate-800 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">
                  No notifications.
                </div>
              )}
            </div>
            <div className="px-4 py-2 border-t text-center bg-slate-50">
              <Link href={notifHref} className="text-xs text-blue-600 hover:underline font-medium">
                View all notifications
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-slate-200 mx-1"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <AvatarInitials name={displayName} size="sm" />
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-slate-700 leading-tight">
                  {displayName}
                </p>
                <p className="text-xs text-slate-400 leading-tight">{displayEmail}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-medium text-slate-900">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={profileHref} className="cursor-pointer flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer flex items-center gap-2"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
